"use client";

import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

function FilterSection({ onChangeFilters }) {
  const [selectedProduct_type, setSelectedProduct_type] = useState([]);
  const [selectedCertifications, setSelectedCertifications] = useState([]);
  const [selectedPurchase_mode, setSelectedPurchase_mode] = useState([]);
  const [selectedProduction_method, setSelectedProduction_method] = useState(
    []
  );
  const [selectedAdditional_services, setSelectedAdditional_services] =
    useState([]);
  const [selectedAvaibility, setSelectedAvaibility] = useState([]);

  const handleCheckboxChange = (setState, selectedState, value) => {
    if (selectedState.includes(value)) {
      setState(selectedState.filter((item) => item !== value));
    } else {
      setState([...selectedState, value]);
    }
  };

  useEffect(() => {
    onChangeFilters({
      product_type: selectedProduct_type,
      certifications: selectedCertifications,
      purchase_mode: selectedPurchase_mode,
      production_method: selectedProduction_method,
      additional_services: selectedAdditional_services,
      avaibility: selectedAvaibility,
    });
  }, [
    selectedProduct_type,
    selectedCertifications,
    selectedPurchase_mode,
    selectedProduction_method,
    selectedAdditional_services,
    selectedAvaibility,
    onChangeFilters,
  ]);

  return (
    <div className="grid grid-cols-1 p-2 sm:p-4 md:p-6 items-center w-full bg-slate-100 gap-4">
      {/* Checkboxes for product_type */}
      <div>
        <h3 className="font-bold mb-2">Type de Produits</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Fruits"
              checked={selectedProduct_type.includes("Fruits")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduct_type,
                  selectedProduct_type,
                  "Fruits"
                )
              }
            />
            <label
              htmlFor="Fruits"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Fruits
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Légumes"
              checked={selectedProduct_type.includes("Légumes")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduct_type,
                  selectedProduct_type,
                  "Légumes"
                )
              }
            />
            <label
              htmlFor="Légumes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Légumes
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Produits laitiers"
              checked={selectedProduct_type.includes("Produits laitiers")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduct_type,
                  selectedProduct_type,
                  "Produits laitiers"
                )
              }
            />
            <label
              htmlFor="Produits laitiers"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Produits laitiers
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Viande"
              checked={selectedProduct_type.includes("Viande")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduct_type,
                  selectedProduct_type,
                  "Viande"
                )
              }
            />
            <label
              htmlFor="Viande"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Viande
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Œufs"
              checked={selectedProduct_type.includes("Œufs")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduct_type,
                  selectedProduct_type,
                  "Œufs"
                )
              }
            />
            <label
              htmlFor="Œufs"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Œufs
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Produits transformés"
              checked={selectedProduct_type.includes("Produits transformés")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduct_type,
                  selectedProduct_type,
                  "Produits transformés"
                )
              }
            />
            <label
              htmlFor="Produits transformés"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Produits transformés
            </label>
          </div>
        </div>
      </div>

      {/* Checkboxes for certifications */}
      <div>
        <h3 className="font-bold mb-2">Certifications</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Label AB"
              checked={selectedCertifications.includes("Label AB")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedCertifications,
                  selectedCertifications,
                  "Label AB"
                )
              }
            />
            <label
              htmlFor="Label AB"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Label AB
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Label Rouge"
              checked={selectedCertifications.includes("Label Rouge")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedCertifications,
                  selectedCertifications,
                  "Label Rouge"
                )
              }
            />
            <label
              htmlFor="Label Rouge"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Label Rouge
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="AOP/AOC"
              checked={selectedCertifications.includes("AOP/AOC")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedCertifications,
                  selectedCertifications,
                  "AOP/AOC"
                )
              }
            />
            <label
              htmlFor="AOP/AOC"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              AOP/AOC
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="HVE"
              checked={selectedCertifications.includes("HVE")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedCertifications,
                  selectedCertifications,
                  "HVE"
                )
              }
            />
            <label
              htmlFor="HVE"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              HVE
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Demeter"
              checked={selectedCertifications.includes("Demeter")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedCertifications,
                  selectedCertifications,
                  "Demeter"
                )
              }
            />
            <label
              htmlFor="Demeter"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Demeter
            </label>
          </div>
        </div>
      </div>

      {/* Checkboxes for purchase_mode */}
      <div>
        <h3 className="font-bold mb-2">Type d'achat</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Vente directe à la ferme"
              checked={selectedPurchase_mode.includes(
                "Vente directe à la ferme"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedPurchase_mode,
                  selectedPurchase_mode,
                  "Vente directe à la ferme"
                )
              }
            />
            <label
              htmlFor="Vente directe à la ferme"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Vente directe à la ferme
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Marché local"
              checked={selectedPurchase_mode.includes("Marché local")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedPurchase_mode,
                  selectedPurchase_mode,
                  "Marché local"
                )
              }
            />
            <label
              htmlFor="Marché local"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Marché local
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Livraison à domicile"
              checked={selectedPurchase_mode.includes("Livraison à domicile")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedPurchase_mode,
                  selectedPurchase_mode,
                  "Livraison à domicile"
                )
              }
            />
            <label
              htmlFor="Livraison à domicile"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Livraison à domicile
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Point de vente collectif"
              checked={selectedPurchase_mode.includes(
                "Point de vente collectif"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedPurchase_mode,
                  selectedPurchase_mode,
                  "Point de vente collectif"
                )
              }
            />
            <label
              htmlFor="Point de vente collectif"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Point de vente collectif
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Drive fermier"
              checked={selectedPurchase_mode.includes("Drive fermier")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedPurchase_mode,
                  selectedPurchase_mode,
                  "Drive fermier"
                )
              }
            />
            <label
              htmlFor="Drive fermier"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Drive fermier
            </label>
          </div>
        </div>
      </div>

      {/* Checkboxes for production_method */}
      <div>
        <h3 className="font-bold mb-2">Méthode de Production</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Agriculture conventionnelle"
              checked={selectedProduction_method.includes(
                "Agriculture conventionnelle"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduction_method,
                  selectedProduction_method,
                  "Agriculture conventionnelle"
                )
              }
            />
            <label
              htmlFor="Agriculture conventionnelle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Agriculture conventionnelle
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Agriculture biologique"
              checked={selectedProduction_method.includes(
                "Agriculture biologique"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduction_method,
                  selectedProduction_method,
                  "Agriculture biologique"
                )
              }
            />
            <label
              htmlFor="Agriculture biologique"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Agriculture biologique
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Agriculture durable"
              checked={selectedProduction_method.includes(
                "Agriculture durable"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduction_method,
                  selectedProduction_method,
                  "Agriculture durable"
                )
              }
            />
            <label
              htmlFor="Agriculture durable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Agriculture durable
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Agriculture raisonnée"
              checked={selectedProduction_method.includes(
                "Agriculture raisonnée"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedProduction_method,
                  selectedProduction_method,
                  "Agriculture raisonnée"
                )
              }
            />
            <label
              htmlFor="Agriculture raisonnée"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Agriculture raisonnée
            </label>
          </div>
        </div>
      </div>

      {/* Checkboxes for additional_services */}
      <div>
        <h3 className="font-bold mb-2">Services Additionnels</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Visite de la ferme"
              checked={selectedAdditional_services.includes(
                "Visite de la ferme"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAdditional_services,
                  selectedAdditional_services,
                  "Visite de la ferme"
                )
              }
            />
            <label
              htmlFor="Visite de la ferme"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Visite de la ferme
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Ateliers de cuisine"
              checked={selectedAvaibility.includes("Ateliers de cuisine")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Ateliers de cuisine"
                )
              }
            />
            <label
              htmlFor="Ateliers de cuisine"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ateliers de cuisine
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Hébergement"
              checked={selectedAvaibility.includes("Hébergement")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Hébergement"
                )
              }
            />
            <label
              htmlFor="Hébergement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Hébergement
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Activités pour enfants"
              checked={selectedAvaibility.includes("Activités pour enfants")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Activités pour enfants"
                )
              }
            />
            <label
              htmlFor="Activités pour enfants"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Activités pour enfants
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Réservation pour événements"
              checked={selectedAvaibility.includes(
                "Réservation pour événements"
              )}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Réservation pour événements"
                )
              }
            />
            <label
              htmlFor="Réservation pour événements"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Réservation pour événements
            </label>
          </div>
        </div>
      </div>

      {/* Checkboxes for availability */}
      <div>
        <h3 className="font-bold mb-2">Disponibilité</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Saisonnière"
              checked={selectedAvaibility.includes("Saisonnière")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Saisonnière"
                )
              }
            />
            <label
              htmlFor="Saisonnière"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Saisonnière
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Toute l'année"
              checked={selectedAvaibility.includes("Toute l'année")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Toute l'année"
                )
              }
            />
            <label
              htmlFor="Toute l'année"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Toute l'année
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Pré-commande"
              checked={selectedAvaibility.includes("Pré-commande")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Pré-commande"
                )
              }
            />
            <label
              htmlFor="Pré-commande"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pré-commande
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Sur abonnement"
              checked={selectedAvaibility.includes("Sur abonnement")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Sur abonnement"
                )
              }
            />
            <label
              htmlFor="Sur abonnement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Sur abonnement
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="Événements spéciaux"
              checked={selectedAvaibility.includes("Événements spéciaux")}
              onCheckedChange={() =>
                handleCheckboxChange(
                  setSelectedAvaibility,
                  selectedAvaibility,
                  "Événements spéciaux"
                )
              }
            />
            <label
              htmlFor="Événements spéciaux"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Événements spéciaux
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterSection;
