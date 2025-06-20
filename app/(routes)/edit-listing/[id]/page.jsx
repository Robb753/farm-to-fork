"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import FileUpload from "../_components/FileUpload";
import {
  Loader2,
  Save,
  Globe,
  Send,
  ArrowLeft,
  Users,
  Camera,
  Check,
  ChevronRight,
  TractorIcon,
  Mail,
  Phone,
} from "@/utils/icons";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import * as Yup from "yup";
import ProductSelector from "../_components/ProductSelector";

// Define the product types
const productTypeItems = [
  { id: "Fruits", label: "Fruits", icon: "🍎" },
  { id: "Légumes", label: "Légumes", icon: "🥕" },
  { id: "Produits laitiers", label: "Produits laitiers", icon: "🥛" },
  { id: "Viande", label: "Viande", icon: "🥩" },
  { id: "Œufs", label: "Œufs", icon: "🥚" },
  { id: "Produits transformés", label: "Produits transformés", icon: "🍯" },
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
  { id: "Click & Collect", label: "Click & Collect" },
];

const certificationsItems = [
  { id: "Label AB", label: "Label AB" },
  { id: "Label Rouge", label: "Label Rouge" },
  { id: "AOC/AOP", label: "AOC/AOP" },
  { id: "IGP", label: "IGP" },
  { id: "Demeter", label: "Demeter" },
];

const additionalServicesItems = [
  { id: "Visite de la ferme", label: "Visite de la ferme" },
  { id: "Ateliers de cuisine", label: "Ateliers de cuisine" },
  { id: "Dégustation", label: "Dégustation" },
  { id: "Activités pour enfants", label: "Activités pour enfants" },
  {
    id: "Événements pour professionnels",
    label: "Événements pour professionnels",
  },
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

function EditListing({ params }) {
  const { user } = useUser();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSections, setCompletedSections] = useState([]);

  const steps = [
    { id: 1, title: "Informations générales", icon: Users },
    { id: 2, title: "Produits & Services", icon: TractorIcon },
    { id: 3, title: "Certifications & Méthodes", icon: Check },
    { id: 4, title: "Photos & Finalisation", icon: Camera },
  ];

  useEffect(() => {
    if (user) {
      verifyUserRecord();
    }
  }, [user]);

  const verifyUserRecord = async () => {
    setIsLoadingInitialData(true);

    if (!params?.id || isNaN(Number(params.id))) {
      toast.error("Identifiant de fiche invalide.");
      router.replace("/");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("listing")
        .select("*, listingImages(listing_id, url)")
        .eq("createdBy", user?.primaryEmailAddress?.emailAddress)
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
      active: isPublishing || listing?.active || false,
    };

    if (isPublishing && !listing?.active) {
      transformedValues.published_at = new Date().toISOString();
    }

    transformedValues.modified_at = new Date().toISOString();

    setLoading(true);
    try {
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

      await supabase.from("products").delete().eq("listing_id", params.id);

      const formattedProducts = selectedProducts.map((name) => ({
        listing_id: params.id,
        name,
        available: true,
      }));

      if (formattedProducts.length > 0) {
        const { error: insertError } = await supabase
          .from("products")
          .insert(formattedProducts);

        if (insertError) {
          console.error(
            "Erreur lors de l'insertion des produits :",
            insertError
          );
          toast.error("Erreur lors de l'enregistrement des produits");
        }
      }

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
        toast.success("Fiche publiée avec succès !");
        setTimeout(() => {
          router.push(`/dashboard/farms`);
        }, 1000);
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
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const progress = (completedSections.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => router.back()}
                      type="button"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Retour
                    </Button>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Modifier votre ferme
                      </h1>
                      <p className="text-gray-600 mt-1">
                        Complétez votre fiche ferme pour attirer plus de clients
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1">
                    {Math.round(progress)}% complété
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <Progress value={progress} className="h-2 mb-4" />
                  <div className="flex justify-between">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = completedSections.includes(step.id);
                      const isCurrent = currentStep === step.id;

                      return (
                        <div
                          key={step.id}
                          className="flex flex-col items-center cursor-pointer"
                          onClick={() => setCurrentStep(step.id)}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : isCurrent
                                  ? "bg-emerald-500 text-white"
                                  : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-sm font-medium ${isCurrent ? "text-emerald-600" : "text-gray-500"}`}
                          >
                            {step.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 1: Informations générales */}
                {currentStep === 1 && (
                  <Card className="shadow-lg border-0">
                    <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Informations générales
                      </CardTitle>
                      <CardDescription className="text-emerald-50">
                        Présentez votre ferme et vos coordonnées
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="farm-name"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <TractorIcon className="w-4 h-4 text-emerald-500" />
                            Nom de la ferme *
                          </Label>
                          <Input
                            id="farm-name"
                            placeholder="Ex: Ferme du Soleil Levant"
                            className="border-gray-200"
                            name="name"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.name}
                          />
                          {errors.name && touched.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <Phone className="w-4 h-4 text-emerald-500" />
                            Téléphone
                          </Label>
                          <Input
                            id="phone"
                            placeholder="06 12 34 56 78"
                            className="border-gray-200"
                            name="phoneNumber"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.phoneNumber}
                          />
                          {errors.phoneNumber && touched.phoneNumber && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4 text-emerald-500" />
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="contact@ferme-soleil.fr"
                            className="border-gray-200"
                            name="email"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.email}
                          />
                          {errors.email && touched.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="website"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <Globe className="w-4 h-4 text-emerald-500" />
                            Site web
                          </Label>
                          <Input
                            id="website"
                            placeholder="www.ferme-soleil.fr"
                            className="border-gray-200"
                            name="website"
                            onChange={handleChange}
                            value={values.website}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="description"
                          className="text-sm font-medium"
                        >
                          Description de votre ferme
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Décrivez votre ferme, votre histoire, vos valeurs..."
                          className="min-h-[120px] border-gray-200"
                          name="description"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          value={values.description}
                        />
                        {errors.description && touched.description && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Une belle description attire plus de clients !
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Produits & Services */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <Card className="shadow-lg border-0">
                      <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                        <CardTitle className="flex items-center gap-2">
                          <TractorIcon className="w-5 h-5" />
                          Types de produits
                        </CardTitle>
                        <CardDescription className="text-orange-50">
                          Sélectionnez les types de produits que vous proposez
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-3 gap-4">
                          {productTypeItems.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer"
                            >
                              <Checkbox
                                id={product.id}
                                checked={values.product_type.includes(
                                  product.id
                                )}
                                onCheckedChange={(checked) => {
                                  const newValues = checked
                                    ? [...values.product_type, product.id]
                                    : values.product_type.filter(
                                        (value) => value !== product.id
                                      );
                                  setFieldValue("product_type", newValues);
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{product.icon}</span>
                                <Label
                                  htmlFor={product.id}
                                  className="cursor-pointer font-medium"
                                >
                                  {product.label}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle>Produits spécifiques</CardTitle>
                        <CardDescription>
                          Sélectionnez les produits précis que vous vendez
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProductSelector
                          selectedTypes={values.product_type}
                          selectedProducts={selectedProducts}
                          onChange={setSelectedProducts}
                        />
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle>Services additionnels</CardTitle>
                        <CardDescription>
                          Proposez-vous des services complémentaires ?
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {additionalServicesItems.map((service, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                          >
                            <Checkbox
                              id={`service-${index}`}
                              checked={values.additional_services.includes(
                                service.id
                              )}
                              onCheckedChange={(checked) => {
                                const newValues = checked
                                  ? [...values.additional_services, service.id]
                                  : values.additional_services.filter(
                                      (value) => value !== service.id
                                    );
                                setFieldValue("additional_services", newValues);
                              }}
                            />
                            <Label
                              htmlFor={`service-${index}`}
                              className="cursor-pointer"
                            >
                              {service.label}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: Certifications & Méthodes */}
                {currentStep === 3 && (
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-0">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                        <CardTitle className="text-lg">
                          Méthodes de production
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {productionMethodItems.map((method, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <Checkbox
                              id={`method-${index}`}
                              checked={values.production_method.includes(
                                method.id
                              )}
                              onCheckedChange={(checked) => {
                                const newValues = checked
                                  ? [...values.production_method, method.id]
                                  : values.production_method.filter(
                                      (value) => value !== method.id
                                    );
                                setFieldValue("production_method", newValues);
                              }}
                            />
                            <Label
                              htmlFor={`method-${index}`}
                              className="cursor-pointer text-sm"
                            >
                              {method.label}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                        <CardTitle className="text-lg">
                          Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {certificationsItems.map((cert, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <Checkbox
                              id={`cert-${index}`}
                              checked={values.certifications.includes(cert.id)}
                              onCheckedChange={(checked) => {
                                const newValues = checked
                                  ? [...values.certifications, cert.id]
                                  : values.certifications.filter(
                                      (value) => value !== cert.id
                                    );
                                setFieldValue("certifications", newValues);
                              }}
                            />
                            <Label
                              htmlFor={`cert-${index}`}
                              className="cursor-pointer text-sm"
                            >
                              {cert.label}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                      <CardHeader className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-t-lg">
                        <CardTitle className="text-lg">Modes d'achat</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {purchaseModeItems.map((mode, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <Checkbox
                              id={`mode-${index}`}
                              checked={values.purchase_mode.includes(mode.id)}
                              onCheckedChange={(checked) => {
                                const newValues = checked
                                  ? [...values.purchase_mode, mode.id]
                                  : values.purchase_mode.filter(
                                      (value) => value !== mode.id
                                    );
                                setFieldValue("purchase_mode", newValues);
                              }}
                            />
                            <Label
                              htmlFor={`mode-${index}`}
                              className="cursor-pointer text-sm"
                            >
                              {mode.label}
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 4: Photos */}
                {currentStep === 4 && (
                  <Card className="shadow-lg border-0">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Photos de votre ferme
                      </CardTitle>
                      <CardDescription className="text-indigo-50">
                        Ajoutez des photos attrayantes pour présenter votre
                        ferme
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <FileUpload
                        setImages={(value) => setImages(value)}
                        imageList={listing?.listingImages}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="gap-2"
                    type="button"
                  >
                    Précédent
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={loading}
                      onClick={() => onSubmitHandler(values, false)}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Enregistrer le brouillon
                    </Button>

                    {currentStep < steps.length ? (
                      <Button
                        onClick={() =>
                          setCurrentStep(
                            Math.min(steps.length, currentStep + 1)
                          )
                        }
                        className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                        type="button"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            disabled={loading}
                            className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                          >
                            <Check className="w-4 h-4" />
                            Publier la fiche
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-green-100">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-green-700">
                              Êtes-vous sûr de vouloir publier cette ferme ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Une fois publiée, votre ferme sera visible par
                              tous les utilisateurs.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setLoading(true);
                                setTimeout(() => {
                                  onSubmitHandler(values, true);
                                }, 400);
                              }}
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              Confirmer et publier
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}

export default EditListing;
