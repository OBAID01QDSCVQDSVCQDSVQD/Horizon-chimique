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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, FileText } from 'lucide-react';

interface Catalogue {
  _id: string;
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre</label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domaine d'application</label>
                  <Textarea
                    value={formData.domaine}
                    onChange={(e) =>
                      setFormData({ ...formData, domaine: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Propriétés principales</label>
                  <Textarea
                    value={formData.proprietes}
                    onChange={(e) =>
                      setFormData({ ...formData, proprietes: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Préparation du support</label>
                  <Textarea
                    value={formData.preparation}
                    onChange={(e) =>
                      setFormData({ ...formData, preparation: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Conditions d'application</label>
                  <Textarea
                    value={formData.conditions}
                    onChange={(e) =>
                      setFormData({ ...formData, conditions: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Application</label>
                  <Textarea
                    value={formData.application}
                    onChange={(e) =>
                      setFormData({ ...formData, application: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Consommation</label>
                  <Textarea
                    value={formData.consommation}
                    onChange={(e) =>
                      setFormData({ ...formData, consommation: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nettoyage</label>
                  <Textarea
                    value={formData.nettoyage}
                    onChange={(e) =>
                      setFormData({ ...formData, nettoyage: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stockage et conditionnement</label>
                  <Textarea
                    value={formData.stockage}
                    onChange={(e) =>
                      setFormData({ ...formData, stockage: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Consignes de sécurité</label>
                  <Textarea
                    value={formData.consignes}
                    onChange={(e) =>
                      setFormData({ ...formData, consignes: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Short description</label>
                  <Input
                    value={formData.shortdesc}
                    onChange={(e) => setFormData({ ...formData, shortdesc: e.target.value })}
                    maxLength={120}
                  />
                </div>
                <div className="flex justify-end space-x-2">
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
                </div>
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
                  <TableHead>Date de création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogues.map((catalogue) => (
                  <TableRow key={catalogue._id}>
                    <TableCell>{catalogue.title}</TableCell>
                    <TableCell>
                      {new Date(catalogue.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setViewingCatalogue(catalogue)}
                        >
                          <FiEye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(catalogue)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(catalogue._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(`/api/catalogues/${catalogue._id}/pdf`, '_blank')}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Dialog open={!!viewingCatalogue} onOpenChange={open => !open && setViewingCatalogue(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails du catalogue</DialogTitle>
              </DialogHeader>
              {viewingCatalogue && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto bg-gray-50 rounded-lg p-4">
                  <div className="col-span-1 md:col-span-2 border-b pb-2 mb-2">
                    <span className="text-lg font-bold text-blue-700">{viewingCatalogue.title}</span>
                    <div className="text-xs text-gray-400 pt-1">Créé le: {new Date(viewingCatalogue.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Description</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.description}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Domaine d'application</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.domaine}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Propriétés principales</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.proprietes}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Préparation du support</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.preparation}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Conditions d'application</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.conditions}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Application</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.application}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Consommation</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.consommation}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Nettoyage</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.nettoyage}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-600 mb-1">Stockage et conditionnement</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.stockage}</div>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <div className="font-semibold text-gray-600 mb-1">Consignes de sécurité</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.consignes}</div>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <div className="font-semibold text-gray-600 mb-1">Short description</div>
                    <div className="text-gray-800 bg-white rounded p-2 shadow-sm border whitespace-pre-line">{viewingCatalogue.shortdesc}</div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 