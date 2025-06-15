"use client";
import React, { useEffect, useState } from "react";
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiDownload } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import TiptapEditor from '@/components/TiptapEditor';

interface Catalogue {
  _id: { $oid: string } | string;
  title: string;
  description: string;
  domaine: string;
  proprietes: string;
  preparation: string;
  conditions: string;
  application: string;
  consommation: string;
  nettoyage: string;
  stockage: string;
  consignes: string;
  createdAt: string;
  updatedAt: string;
  shortdesc: string;
}

export default function AdminCataloguesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCatalogue, setEditingCatalogue] = useState<Catalogue | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domaine: '',
    proprietes: '',
    preparation: '',
    conditions: '',
    application: '',
    consommation: '',
    nettoyage: '',
    stockage: '',
    consignes: '',
    shortdesc: '',
  });
  const [viewingCatalogue, setViewingCatalogue] = useState<Catalogue | null>(null);

  useEffect(() => {
    fetchCatalogues();
  }, []);

  const fetchCatalogues = async () => {
    try {
      const response = await fetch('/api/catalogues');
      if (!response.ok) throw new Error('Erreur lors de la récupération des catalogues');
      const data = await response.json();
      setCatalogues(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la récupération des catalogues');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCatalogue
        ? `/api/catalogues/${editingCatalogue._id}`
        : '/api/catalogues';
      const method = editingCatalogue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');

      toast.success(
        editingCatalogue
          ? 'Catalogue mis à jour avec succès'
          : 'Catalogue créé avec succès'
      );
      setIsDialogOpen(false);
      fetchCatalogues();
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde du catalogue');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce catalogue ?')) return;

    try {
      const response = await fetch(`/api/catalogues/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast.success('Catalogue supprimé avec succès');
      fetchCatalogues();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression du catalogue');
    }
  };

  const handleEdit = (catalogue: Catalogue) => {
    console.log('handleEdit called with catalogue:', catalogue);
    setEditingCatalogue(catalogue);
    setFormData({
      title: catalogue.title,
      description: catalogue.description,
      domaine: catalogue.domaine,
      proprietes: catalogue.proprietes,
      preparation: catalogue.preparation,
      conditions: catalogue.conditions,
      application: catalogue.application,
      consommation: catalogue.consommation,
      nettoyage: catalogue.nettoyage,
      stockage: catalogue.stockage,
      consignes: catalogue.consignes,
      shortdesc: catalogue.shortdesc,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      domaine: '',
      proprietes: '',
      preparation: '',
      conditions: '',
      application: '',
      consommation: '',
      nettoyage: '',
      stockage: '',
      consignes: '',
      shortdesc: '',
    });
    setEditingCatalogue(null);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Catalogues</CardTitle>
            <CardDescription>
              Gérez les catalogues de produits
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Catalogue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCatalogue ? 'Modifier le Catalogue' : 'Nouveau Catalogue'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="title" className="text-right">
                    Titre
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="shortdesc" className="block text-left mb-1">
                    Courte Description
                  </label>
                  <TiptapEditor
                    content={formData.shortdesc}
                    onChange={(newContent) =>
                      setFormData({ ...formData, shortdesc: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-left mb-1">
                    Description
                  </label>
                  <TiptapEditor
                    content={formData.description}
                    onChange={(newContent) =>
                      setFormData({ ...formData, description: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="domaine" className="block text-left mb-1">
                    Domaine
                  </label>
                  <TiptapEditor
                    content={formData.domaine}
                    onChange={(newContent) =>
                      setFormData({ ...formData, domaine: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="proprietes" className="block text-left mb-1">
                    Propriétés Physiques
                  </label>
                  <TiptapEditor
                    content={formData.proprietes}
                    onChange={(newContent) =>
                      setFormData({ ...formData, proprietes: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="preparation" className="block text-left mb-1">
                    Préparation du support
                  </label>
                  <TiptapEditor
                    content={formData.preparation}
                    onChange={(newContent) =>
                      setFormData({ ...formData, preparation: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="conditions" className="block text-left mb-1">
                    Conditions d'application
                  </label>
                  <TiptapEditor
                    content={formData.conditions}
                    onChange={(newContent) =>
                      setFormData({ ...formData, conditions: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="application" className="block text-left mb-1">
                    Application
                  </label>
                  <TiptapEditor
                    content={formData.application}
                    onChange={(newContent) =>
                      setFormData({ ...formData, application: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="consommation" className="block text-left mb-1">
                    Consommation
                  </label>
                  <TiptapEditor
                    content={formData.consommation}
                    onChange={(newContent) =>
                      setFormData({ ...formData, consommation: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="nettoyage" className="block text-left mb-1">
                    Nettoyage du Matériel
                  </label>
                  <TiptapEditor
                    content={formData.nettoyage}
                    onChange={(newContent) =>
                      setFormData({ ...formData, nettoyage: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="stockage" className="block text-left mb-1">
                    Stockage
                  </label>
                  <TiptapEditor
                    content={formData.stockage}
                    onChange={(newContent) =>
                      setFormData({ ...formData, stockage: newContent })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="consignes" className="block text-left mb-1">
                    Consignes de sécurité
                  </label>
                  <TiptapEditor
                    content={formData.consignes}
                    onChange={(newContent) =>
                      setFormData({ ...formData, consignes: newContent })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingCatalogue ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Courte Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogues.map((catalogue) => {
                  const catalogueId = typeof catalogue._id === 'object' && '$oid' in catalogue._id
                    ? catalogue._id.$oid
                    : String(catalogue._id);

                  return (
                    <TableRow key={catalogueId as string}>
                      <TableCell>{catalogue.title}</TableCell>
                      <TableCell>{catalogue.shortdesc}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingCatalogue(catalogue)}
                          >
                            <FiEye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(catalogue)}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(catalogueId)}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                          <a
                            href={`/api/catalogues/${catalogueId}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                          >
                            <FiDownload className="h-4 w-4" />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingCatalogue} onOpenChange={() => setViewingCatalogue(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
            <DialogTitle>Détails du Catalogue</DialogTitle>
              </DialogHeader>
              {viewingCatalogue && (
            <div className="grid gap-4">
              <div>
                <h3 className="font-semibold">Titre</h3>
                <p>{viewingCatalogue.title}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Courte Description</h3>
                <p>{viewingCatalogue.shortdesc}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Description</h3>
                <p>{viewingCatalogue.description}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Domaine</h3>
                <p>{viewingCatalogue.domaine}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Propriétés</h3>
                <p>{viewingCatalogue.proprietes}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Préparation</h3>
                <p>{viewingCatalogue.preparation}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Conditions</h3>
                <p>{viewingCatalogue.conditions}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Application</h3>
                <p>{viewingCatalogue.application}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Consommation</h3>
                <p>{viewingCatalogue.consommation}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Nettoyage</h3>
                <p>{viewingCatalogue.nettoyage}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Stockage</h3>
                <p>{viewingCatalogue.stockage}</p>
                  </div>
              <div>
                <h3 className="font-semibold">Consignes</h3>
                <p>{viewingCatalogue.consignes}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
    </div>
  );
} 