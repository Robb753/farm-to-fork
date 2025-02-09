"use client";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import FileUpload from "../_components/FileUpload";
import { Loader } from "lucide-react";
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
  { id: "Toute l'année", label: "Toute l'année" }, // Remarque : Remplacez "lannée" par "l'année"
  { id: "Pré-commande", label: "Pré-commande" },
  { id: "Sur abonnement", label: "Sur abonnement" },
  { id: "Événements spéciaux", label: "Événements spéciaux" },
];

function EditListing({ params }) {
  const { user } = useUser();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      verifyUserRecord();
    }
  }, [user]);

  const verifyUserRecord = async () => {
    const { data, error } = await supabase
      .from("listing")
      .select("*,listingImages(listing_id,url)")
      .eq("createdBy", user?.primaryEmailAddress.emailAddress)
      .eq("id", params.id);

    if (data && data.length > 0) {
      setListing(data[0]);
    } else {
      router.replace("/");
    }
  };

  const onSubmitHandler = async (formValue, isPublishing = false) => {
    // 🔥 Ajout d'une valeur par défaut pour éviter les erreurs de "undefined"
    const transformedValues = {
      ...formValue,
      additional_services: Array.isArray(formValue.additional_services)
        ? formValue.additional_services
        : formValue.additional_services
        ? [formValue.additional_services]
        : [], // 🔥 Assure que c'est toujours un tableau
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
        ? formValue.availability.map((item) =>
            item === "Toute l'année" ? "Toute lannée" : item
          )
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

    console.log("Submitting transformed values:", transformedValues);

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listing")
        .update(transformedValues)
        .eq("id", params.id)
        .select();

      if (error) {
        console.error("Error from Supabase:", error);
        toast("An error occurred during submission");
      }

      if (data) {
        if (isPublishing) {
          // Si publication : message et redirection
          toast("Listing updated and Published");
          setTimeout(() => {
            router.push(`/user#my-listing`);
         }, 2000);
        } else {
          toast("Listing updated");
        }
      }

      for (const image of images) {
        const file = image;
        const fileName = Date.now().toString() + "-" + file.name;
        const fileExt = fileName.split(".").pop();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("listingImages")
          .upload(`${fileName}`, file, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });
        if (uploadError) {
          toast("Error while uploading images");
        } else {
          const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL + fileName;
          const { data: insertData, error: insertError } = await supabase
            .from("listingImages")
            .insert([{ url: imageUrl, listing_id: params?.id }])
            .select();
          if (insertError) {
            toast("Error while saving image URLs");
          }
        }
      }
    } catch (error) {
      toast("An error occurred during submission");
    } finally {
      setLoading(false);
    }
  };

  const publishBtnHandler = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("listing")
      .update({ active: true })
      .eq("id", params?.id)
      .select();

    if (data) {
      setLoading(false);
      toast("Listing Published!");
    }
  };

  return (
    <div className="px-10 md:px-36 my-10">
      <h2 className="font-bold text-2xl">Enter details about your listing</h2>
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
            production_method: listing.production_method || "",
            certifications: listing.certifications || [],
            additional_services: listing.additional_services || [],
            availability: listing.availability || [],
            product_type: listing.product_type || [],
            purchase_mode: listing.purchase_mode || [],
          }}
          validate={(values) => {
            const errors = {};
            if (!values.email) {
              errors.email = "Required";
            } else if (
              !/^[A-Z0-9._%+-]+@[A-Z.-]+\.[A-Z]{2,}$/i.test(values.email)
            ) {
              errors.email = "Invalid email address";
            }
            return errors;
          }}
          onSubmit={(values, { setSubmitting }) => {
            onSubmitHandler(values);
            setTimeout(() => {
              setSubmitting(false);
            }, 400);
          }}
        >
          {({ values, handleChange, handleSubmit, setFieldValue }) => (
            <Form onSubmit={handleSubmit}>
              <div className="p-8 rounded-lg shadow-md w-full">
                <div className="grid grid-cols-3 gap-4 md:grid-cols-3">
                  {/* Nom de la ferme */}
                  <div className="col-span-3 flex flex-col gap-2">
                    <Label htmlFor="name">Nom de la ferme</Label>
                    <Input
                      id="name"
                      placeholder="Nom de la ferme"
                      name="name"
                      onChange={handleChange}
                      value={values.name}
                    />
                  </div>

                  {/* Product Types (Checkboxes) */}
                  <div className="grid grid-cols-1 gap-20">
                    <Label className="font-bold text-xl">Product Types</Label>
                    {productTypeItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          checked={values.product_type.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const newProductTypes = checked
                              ? [...values.product_type, item.id]
                              : values.product_type.filter(
                                  (value) => value !== item.id
                                );
                            setFieldValue("product_type", newProductTypes);
                          }}
                        />
                        <Label>{item.label}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Production Method (Checkboxes) */}
                  <div className="grid grid-cols-1 gap-2">
                    <Label className="font-bold text-xl">
                      Production Method
                    </Label>
                    {productionMethodItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          checked={values.production_method.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const newProductionMethod = checked
                              ? [...values.production_method, item.id]
                              : values.production_method.filter(
                                  (value) => value !== item.id
                                );
                            setFieldValue(
                              "production_method",
                              newProductionMethod
                            );
                          }}
                        />
                        <Label>{item.label}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Certifications (Checkboxes) */}
                  <div className="grid grid-cols-1 gap-2">
                    <Label className="font-bold text-xl">Certifications</Label>
                    {certificationsItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          checked={values.certifications.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const newCertifications = checked
                              ? [...values.certifications, item.id]
                              : values.certifications.filter(
                                  (value) => value !== item.id
                                );
                            setFieldValue("certifications", newCertifications);
                          }}
                        />
                        <Label>{item.label}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Additional Services (Checkboxes) */}
                  <div className="grid grid-cols-1 gap-2">
                    <Label className="font-bold text-xl">
                      Additional Services
                    </Label>
                    {additionalServicesItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          checked={values.additional_services.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const newAdditionalServices = checked
                              ? [...values.additional_services, item.id]
                              : values.additional_services.filter(
                                  (value) => value !== item.id
                                );
                            setFieldValue(
                              "additional_services",
                              newAdditionalServices
                            );
                          }}
                        />
                        <Label>{item.label}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Availability (Checkboxes) */}
                  <div className="grid grid-cols-1 gap-2">
                    <Label className="font-bold text-xl">
                      Products Availability
                    </Label>
                    {availabilityItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          checked={values.availability.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const newAvailability = checked
                              ? [...values.availability, item.id]
                              : values.availability.filter(
                                  (value) => value !== item.id
                                );
                            setFieldValue("availability", newAvailability);
                          }}
                        />
                        <Label>{item.label}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Purchase Mode (Checkboxes) */}
                  <div className="grid grid-cols-1 gap-2">
                    <Label className="font-bold text-xl">Purchase Mode</Label>
                    {purchaseModeItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3">
                        <Checkbox
                          checked={values.purchase_mode.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const newPurchase_mode = checked
                              ? [...values.purchase_mode, item.id]
                              : values.purchase_mode.filter(
                                  (value) => value !== item.id
                                );
                            setFieldValue("purchase_mode", newPurchase_mode);
                          }}
                        />
                        <Label>{item.label}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Phone Number */}
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="Numéro de téléphone"
                        name="phoneNumber"
                        onChange={handleChange}
                        value={values.phoneNumber}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="grid grid-cols-1 gap-10">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="Email"
                        type="email"
                        name="email"
                        onChange={handleChange}
                        value={values.email}
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="grid grid-cols-1 gap-10">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="website">Web Site</Label>
                      <Input
                        id="website"
                        placeholder="Site web"
                        type="url"
                        name="website"
                        onChange={handleChange}
                        value={values.website}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-3 flex flex-col gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Description"
                      name="description"
                      onChange={handleChange}
                      value={values.description}
                    />
                  </div>

                  {/* File Upload */}
                  <div className="col-span-3">
                    <h2 className="font-lg text-grey-500 mt-2">
                      Upload Farm Images
                    </h2>
                    <FileUpload
                      setImages={(value) => setImages(value)}
                      imageList={listing?.listingImages}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="col-span-3 flex justify-end gap-2">
                    {/* 🔹 Bouton Save (Brouillon) */}
                    <Button
                      disabled={loading}
                      variant="outline"
                      className="text-primary"
                      type="button"
                      onClick={() => onSubmitHandler(values, false)}
                    >
                      {loading ? <Loader className="animate-spin" /> : "Save"}
                    </Button>

                    {/* 🔹 Bouton Publish (avec confirmation) */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" disabled={loading}>
                          {loading ? (
                            <Loader className="animate-spin" />
                          ) : (
                            "Publish"
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure you want to publish this listing?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Once published, your listing will be visible to all
                            users.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onSubmitHandler(values, true)}
                          >
                            {loading ? (
                              <Loader className="animate-spin" />
                            ) : (
                              "Confirm & Publish"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
