<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionPlanController extends Controller
{
    /**
     * Display the user's subscription dashboard.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription;
        
        // Format subscription data for frontend
        $formattedSubscription = null;
        if ($subscription) {
            $formattedSubscription = [
                'id' => $subscription->id,
                'plan' => $subscription->plan,
                'status' => $subscription->status,
                'current_period_start' => $subscription->starts_at,
                'current_period_end' => $subscription->expires_at,
                'cancel_at_period_end' => ($subscription->status === 'cancelled'),
                'duration' => $subscription->duration,
                'is_auto_renew' => $subscription->is_auto_renew,
                'next_renewal_date' => $subscription->expires_at, // Same as period end for simplicity
                'sms_usage' => [
                    'used' => $subscription->sms_used,
                    'total' => $subscription->sms_allowed ?? 0,
                ],
                'limits' => [
                    'clients' => $subscription->clients_limit,
                    'campaigns' => $subscription->campaigns_limit,
                ],
                'campaigns_used' => $subscription->campaigns_used ?? 0,
            ];
        }
        
        // Get recent transactions
        $transactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'description' => $transaction->description,
                    'amount' => $transaction->amount,
                    'date' => $transaction->created_at,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                ];
            });
        
        return Inertia::render('Subscription/Dashboard', [
            'subscription' => $formattedSubscription,
            'transactions' => $transactions,
        ]);
    }
    
    /**
     * Display all user transactions.
     */
    public function transactions(Request $request)
    {
        $user = $request->user();
        
        $transactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'description' => $transaction->description,
                    'amount' => $transaction->amount,
                    'date' => $transaction->created_at,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                ];
            });
        
        return Inertia::render('Subscription/Transactions', [
            'transactions' => $transactions,
        ]);
    }
    
    /**
     * Top up SMS credits.
     */
    public function topUp()
    {
        return Inertia::render('Subscription/TopUp');
    }
    
    /**
     * Increase client limits.
     */
    public function increaseLimit()
    {
        return Inertia::render('Subscription/IncreaseLimit');
    }
    
    /**
     * Toggle auto-renewal status.
     */
    public function toggleAutoRenew(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription;
        
        if (!$subscription) {
            return redirect()->back()->with('error', 'No active subscription found.');
        }
        
        $subscription->is_auto_renew = !$subscription->is_auto_renew;
        $subscription->save();
        
        return redirect()->back()->with('success', 'Auto-renewal settings updated successfully.');
    }
    
    /**
     * Cancel subscription at period end.
     */
    public function cancelAtPeriodEnd(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->back()->with('error', 'No active subscription found.');
        }
        
        $subscription->status = 'cancelled';
        $subscription->save();
        
        // Create a record of the cancellation
        Transaction::create([
            'user_id' => $user->id,
            'description' => 'Subscription cancellation - Will end on ' . $subscription->expires_at->format('Y-m-d'),
            'amount' => 0,
            'type' => 'subscription',
            'status' => 'completed',
        ]);
        
        return redirect()->back()->with('success', 'Your subscription has been cancelled and will end on ' . $subscription->expires_at->format('Y-m-d'));
    }
}