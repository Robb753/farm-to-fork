"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import FileUpload from "../_components/FileUpload";
import { Loader, Save, Globe, Send } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Yup from "yup";

// Define the product types
const productTypeItems = [
  { id: "Fruits", label: "Fruits" },
  { id: "Légumes", label: "Légumes" },
  { id: "Produits laitiers", label: "Produits laitiers" },
  { id: "Viande", label: "Viande" },
  { id: "Œufs", label: "Œufs" },
  { id: "Produits transformés", label: "Produits transformés" },
];

const productionMethodItems = [
  { id: "Agriculture conventionnelle", label: "Agriculture conventionnelle" },
  { id: "Agriculture biologique", label: "Agriculture biologique" },
  { id: "Agriculture durable", label: "Agriculture durable" },
  { id: "Agriculture raisonnée", label: "Agriculture raisonnée" },
];

const purchaseModeItems = [
  { id: "Vente directe à la ferme", label: "Vente directe à la ferme" },
  { id: "Marché local", label: "Marché local" },
  { id: "Livraison à domicile", label: "Livraison à domicile" },
  { id: "Point de vente collectif", label: "Point de vente collectif" },
  { id: "Drive fermier", label: "Drive fermier" },
];

const certificationsItems = [
  { id: "Label AB", label: "Label AB" },
  { id: "Label Rouge", label: "Label Rouge" },
  { id: "AOP/AOC", label: "AOP/AOC" },
  { id: "HVE", label: "HVE" },
  { id: "Demeter", label: "Demeter" },
];

const additionalServicesItems = [
  { id: "Visite de la ferme", label: "Visite de la ferme" },
  { id: "Ateliers de cuisine", label: "Ateliers de cuisine" },
  { id: "Hébergement", label: "Hébergement" },
  { id: "Activités pour enfants", label: "Activités pour enfants" },
  { id: "Réservation pour événements", label: "Réservation pour événements" },
];

const availabilityItems = [
  { id: "Saisonnière", label: "Saisonnière" },
  { id: "Toute l'année", label: "Toute l'année" },
  { id: "Pré-commande", label: "Pré-commande" },
  { id: "Sur abonnement", label: "Sur abonnement" },
  { id: "Événements spéciaux", label: "Événements spéciaux" },
];

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Le nom de la ferme est requis"),
  email: Yup.string().email("Email invalide").required("L'email est requis"),
  phoneNumber: Yup.string().matches(
    /^[0-9]{10}$/,
    "Le numéro de téléphone doit contenir 10 chiffres"
  ),
  description: Yup.string().min(
    10,
    "La description doit contenir au moins 10 caractères"
  ),
  product_type: Yup.array().min(1, "Sélectionnez au moins un type de produit"),
  production_method: Yup.array().min(
    1,
    "Sélectionnez une méthode de production"
  ),
  purchase_mode: Yup.array().min(1, "Sélectionnez un mode d'achat"),
});

// Composant pour les sections de checkbox
function CheckboxSection({ title, items, values, onChange }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <Checkbox
                checked={values.includes(item.id)}
                onCheckedChange={(checked) => {
                  onChange(
                    checked
                      ? [...values, item.id]
                      : values.filter((value) => value !== item.id)
                  );
                }}
                id={`${item.id.replace(/\s+/g, "-")}`}
              />
              <Label
                htmlFor={`${item.id.replace(/\s+/g, "-")}`}
                className="cursor-pointer"
              >
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EditListing({ params }) {
  const { user } = useUser();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  useEffect(() => {
    if (user) {
      verifyUserRecord();
    }
  }, [user]);

  const verifyUserRecord = async () => {
    setIsLoadingInitialData(true);
    try {
      const { data, error } = await supabase
        .from("listing")
        .select("*,listingImages(listing_id,url)")
        .eq("createdBy", user?.primaryEmailAddress.emailAddress)
        .eq("id", params.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setListing(data[0]);
      } else {
        toast.error("Aucun listing trouvé ou autorisations insuffisantes");
        router.replace("/");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du listing:", error);
      toast.error("Une erreur est survenue lors du chargement des données");
    } finally {
      setIsLoadingInitialData(false);
    }
  };

  const onSubmitHandler = async (formValue, isPublishing = false) => {
    // Transformation des valeurs pour s'assurer qu'elles sont dans le bon format
    const transformedValues = {
      ...formValue,
      additional_services: Array.isArray(formValue.additional_services)
        ? formValue.additional_services
        : formValue.additional_services
        ? [formValue.additional_services]
        : [],
      product_type: Array.isArray(formValue.product_type)
        ? formValue.product_type
        : formValue.product_type
        ? [formValue.product_type]
        : [],
      production_method: Array.isArray(formValue.production_method)
        ? formValue.production_method
        : formValue.production_method
        ? [formValue.production_method]
        : [],
      certifications: Array.isArray(formValue.certifications)
        ? formValue.certifications
        : formValue.certifications
        ? [formValue.certifications]
        : [],
      availability: Array.isArray(formValue.availability)
        ? formValue.availability
        : formValue.availability
        ? [formValue.availability]
        : [],
      purchase_mode: Array.isArray(formValue.purchase_mode)
        ? formValue.purchase_mode
        : formValue.purchase_mode
        ? [formValue.purchase_mode]
        : [],
      active: isPublishing, // Détermine si l'annonce est publiée ou reste un brouillon
    };

    setLoading(true);
    try {
      // Mise à jour du listing
      const { data, error } = await supabase
        .from("listing")
        .update(transformedValues)
        .eq("id", params.id)
        .select();

      if (error) {
        console.error("Error from Supabase:", error);
        toast.error("Une erreur est survenue lors de la sauvegarde");
        return;
      }

      // Traitement des images si elles existent
      if (images.length > 0) {
        for (const image of images) {
          const file = image;
          const fileName = Date.now().toString() + "-" + file.name;
          const fileExt = fileName.split(".").pop();
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("listingImages")
              .upload(`${fileName}`, file, {
                contentType: `image/${fileExt}`,
                upsert: false,
              });

          if (uploadError) {
            toast.error("Erreur lors du téléchargement des images");
            console.error("Upload error:", uploadError);
          } else {
            const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL + fileName;
            const { data: insertData, error: insertError } = await supabase
              .from("listingImages")
              .insert([{ url: imageUrl, listing_id: params?.id }])
              .select();

            if (insertError) {
              toast.error("Erreur lors de l'enregistrement des URLs d'images");
              console.error("Insert error:", insertError);
            }
          }
        }
      }

      if (isPublishing) {
        toast.success("Votre ferme a été publiée avec succès!");
        setTimeout(() => {
          router.push(`/user#my-listing`);
        }, 2000);
      } else {
        toast.success("Modifications enregistrées");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-20 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Modifier votre ferme
        </h1>
        <p className="text-gray-600 mt-2">
          Complétez les informations ci-dessous pour mettre à jour votre
          listing.
        </p>
      </div>

      {listing && (
        <Formik
          enableReinitialize
          initialValues={{
            name: listing.name || "",
            phoneNumber: listing.phoneNumber || "",
            email: listing.email || "",
            website: listing.website || "",
            description: listing.description || "",
            profileImage: listing.profileImage || user?.imageUrl || "",
            fullName: listing.fullName || user?.fullName || "",
            production_method: listing.production_method || [],
            certifications: listing.certifications || [],
            additional_services: listing.additional_services || [],
            availability: listing.availability || [],
            product_type: listing.product_type || [],
            purchase_mode: listing.purchase_mode || [],
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            onSubmitHandler(values);
            setTimeout(() => {
              setSubmitting(false);
            }, 400);
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
          }) => (
            <Form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informations générales */}
                <Card className="lg:col-span-3 shadow-sm">
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Nom de la ferme */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="name" className="font-medium">
                          Nom de la ferme*
                        </Label>
                        <Input
                          id="name"
                          placeholder="Nom de votre ferme"
                          name="name"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.name}
                          className={
                            errors.name && touched.name ? "border-red-500" : ""
                          }
                        />
                        {errors.name && touched.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="email" className="font-medium">
                          Email*
                        </Label>
                        <Input
                          id="email"
                          placeholder="contact@exemple.com"
                          type="email"
                          name="email"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.email}
                          className={
                            errors.email && touched.email
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors.email && touched.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="phoneNumber" className="font-medium">
                          Téléphone
                        </Label>
                        <Input
                          id="phoneNumber"
                          placeholder="0612345678"
                          name="phoneNumber"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.phoneNumber}
                          className={
                            errors.phoneNumber && touched.phoneNumber
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors.phoneNumber && touched.phoneNumber && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.phoneNumber}
                          </p>
                        )}
                      </div>

                      {/* Website */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="website" className="font-medium">
                          Site web
                        </Label>
                        <Input
                          id="website"
                          placeholder="https://www.exemple.com"
                          type="url"
                          name="website"
                          onChange={handleChange}
                          value={values.website}
                        />
                      </div>

                      {/* Description - Changé pour un textarea */}
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <Label htmlFor="description" className="font-medium">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Décrivez votre ferme, vos produits et services..."
                          name="description"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.description}
                          className={`min-h-32 ${
                            errors.description && touched.description
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {errors.description && touched.description && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Types */}
                <CheckboxSection
                  title="Types de produits"
                  items={productTypeItems}
                  values={values.product_type}
                  onChange={(newValues) =>
                    setFieldValue("product_type", newValues)
                  }
                />

                {/* Production Method */}
                <CheckboxSection
                  title="Méthodes de production"
                  items={productionMethodItems}
                  values={values.production_method}
                  onChange={(newValues) =>
                    setFieldValue("production_method", newValues)
                  }
                />

                {/* Certifications */}
                <CheckboxSection
                  title="Certifications"
                  items={certificationsItems}
                  values={values.certifications}
                  onChange={(newValues) =>
                    setFieldValue("certifications", newValues)
                  }
                />

                {/* Purchase Mode */}
                <CheckboxSection
                  title="Modes d'achat"
                  items={purchaseModeItems}
                  values={values.purchase_mode}
                  onChange={(newValues) =>
                    setFieldValue("purchase_mode", newValues)
                  }
                />

                {/* Availability */}
                <CheckboxSection
                  title="Disponibilité des produits"
                  items={availabilityItems}
                  values={values.availability}
                  onChange={(newValues) =>
                    setFieldValue("availability", newValues)
                  }
                />

                {/* Additional Services */}
                <CheckboxSection
                  title="Services additionnels"
                  items={additionalServicesItems}
                  values={values.additional_services}
                  onChange={(newValues) =>
                    setFieldValue("additional_services", newValues)
                  }
                />

                {/* File Upload */}
                <Card className="lg:col-span-3 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">
                      Photos de la ferme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      setImages={(value) => setImages(value)}
                      imageList={listing?.listingImages}
                    />
                  </CardContent>
                </Card>

                {/* Buttons */}
                <div className="lg:col-span-3 flex justify-end gap-4 mt-6">
                  {/* Bouton Save (Brouillon) */}
                  <Button
                    disabled={loading}
                    variant="outline"
                    className="text-primary flex items-center gap-2"
                    type="button"
                    onClick={() => onSubmitHandler(values, false)}
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Enregistrer
                  </Button>

                  {/* Bouton Publish (avec confirmation) */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      >
                        {loading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                        Publier
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Êtes-vous sûr de vouloir publier cette ferme ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Une fois publiée, votre ferme sera visible par tous
                          les utilisateurs.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onSubmitHandler(values, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading ? (
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Confirmer et publier
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}

export default EditListing;
