<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TagController extends Controller
{
    /**
     * Afficher la liste des tags
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $tags = Auth::user()->tags()->withCount('clients')->orderBy('name')->get();

        return Inertia::render('Tags/Index', [
            'tags' => $tags
        ]);
    }

    /**
     * Créer un nouveau tag
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:tags,name,NULL,id,user_id,' . Auth::id(),
        ]);

        $validated['user_id'] = Auth::id();

        Tag::create($validated);

        return redirect()->back()->with('success', 'Tag créé avec succès.');
    }

    /**
     * Mettre à jour un tag
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Tag  $tag
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Tag $tag)
    {
        $this->authorize('update', $tag);

        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:tags,name,' . $tag->id . ',id,user_id,' . Auth::id(),
        ]);

        $tag->update($validated);

        return redirect()->back()->with('success', 'Tag mis à jour avec succès.');
    }

    /**
     * Supprimer un tag
     *
     * @param  \App\Models\Tag  $tag
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Tag $tag)
    {
        $this->authorize('delete', $tag);

        $tag->delete();

        return redirect()->back()->with('success', 'Tag supprimé avec succès.');
    }
}
