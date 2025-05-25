"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AddProduct({ params }) {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [listingData, setListingData] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    unit: "kg",
    quantity: "",
    description: "",
    delivery_options: "",
    listingId: params?.id || null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setIsPublishing(publish);

    try {
      const userEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses[0]?.emailAddress;

      if (!userEmail) {
        throw new Error("Email non trouvé");
      }

      // Préparer les données du produit
      const productData = {
        title: formData.title,
        category: formData.category,
        price: formData.price,
        unit: formData.unit,
        quantity: formData.quantity,
        description: formData.description,
        delivery_options: formData.delivery_options,
        listing_id: params.id,
        created_by: userEmail,
        active: publish,
        created_at: new Date().toISOString(),
      };

      // Insérer le nouveau produit
      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select();

      if (error) throw error;

      if (publish) {
        toast.success("Produit publié avec succès !");
      } else {
        toast.success("Produit enregistré comme brouillon");
      }

      // Rediriger vers la page des produits
      setTimeout(() => {
        router.push("/farmer/products");
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      toast.error("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setLoading(false);
      setIsPublishing(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.title &&
      formData.category &&
      formData.price &&
      formData.unit &&
      formData.quantity &&
      formData.description
    );
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="border-t-4 border-t-green-600">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-700">
            Ajouter un nouveau produit
          </CardTitle>
          <CardDescription>
            Renseignez les détails de votre produit pour le publier sur la
            plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="productForm" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-medium">
                Titre de l'annonce *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Tomates fraîches bio"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="font-medium">
                Catégorie *
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange("category", value)}
                value={formData.category}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetables">Légumes</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="dairy">Produits laitiers</SelectItem>
                  <SelectItem value="meat">Viande</SelectItem>
                  <SelectItem value="eggs">Œufs</SelectItem>
                  <SelectItem value="honey">
                    Miel et produits de la ruche
                  </SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="price" className="font-medium">
                  Prix *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="unit" className="font-medium">
                  Unité *
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange("unit", value)}
                  value={formData.unit}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Unité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                    <SelectItem value="g">Gramme (g)</SelectItem>
                    <SelectItem value="unit">Unité</SelectItem>
                    <SelectItem value="box">Caisse</SelectItem>
                    <SelectItem value="dozen">Douzaine</SelectItem>
                    <SelectItem value="l">Litre (L)</SelectItem>
                    <SelectItem value="ml">Millilitre (mL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="quantity" className="font-medium">
                  Quantité disponible *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="10"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-medium">
                Description du produit *
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre produit en détail (variété, méthode de culture, fraîcheur, etc.)"
                className="min-h-[120px]"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_options" className="font-medium">
                Options de livraison
              </Label>
              <Textarea
                id="delivery_options"
                placeholder="Ex: Livraison à domicile dans un rayon de 20km, récupération à la ferme le weekend..."
                className="min-h-[80px]"
                name="delivery_options"
                value={formData.delivery_options}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Précisez les modalités de livraison ou de récupération
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="flex gap-3">
            {/* Bouton Brouillon */}
            <Button
              variant="outline"
              disabled={loading || !isFormValid()}
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center"
            >
              {loading && !isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>

            {/* Bouton Publier avec confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={loading || !isFormValid()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading && isPublishing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Publier
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publier ce produit ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Une fois publié, votre produit sera visible par tous les
                    utilisateurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => handleSubmit(e, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirmer et publier
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
