#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST COMPLET - ONBOARDING FARM2FORK (CommonJS)
 *
 * Ce script teste :
 * 1. ✅ Connexion Supabase
 * 2. ✅ Structure des tables (farmer_requests, listing, products, profiles)
 * 3. ✅ API submit-request (step-1)
 * 4. ✅ API validate-farmer-request (admin)
 * 5. ✅ API generate-profile (step-2)
 * 6. ✅ API create-listing (step-3)
 *
 * Usage:
 *   node test-onboarding-cjs.js
 *
 * Prérequis:
 *   npm install @supabase/supabase-js node-fetch dotenv
 */

// Charger les variables d'environnement
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Données de test
const TEST_DATA = {
  userId: "user_test_" + Date.now(),
  email: `test.farmer.${Date.now()}@farm2fork.test`,
  firstName: "Jean",
  lastName: "Dupont",
  farmName: "Ferme Test " + Date.now(),
  siret: "12345678901234",
  department: "75 - Paris",
  story:
    "Nous sommes une ferme de test spécialisée dans le maraîchage bio. Nos légumes sont disponibles à la ferme.",
  website: "https://fermetest.fr",
};

// ============================================
// UTILITAIRES
// ============================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "cyan");
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "bright");
  console.log("=".repeat(60));
}

// ============================================
// TESTS SUPABASE
// ============================================

async function testSupabaseConnection() {
  logSection("TEST 1: CONNEXION SUPABASE");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logError("Variables d'environnement manquantes");
    logInfo("Vérifiez: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test de connexion simple
    const { data, error } = await supabase
      .from("farmer_requests")
      .select("count")
      .limit(1);

    if (error) {
      logError(`Erreur de connexion: ${error.message}`);
      return null;
    }

    logSuccess("Connexion Supabase OK");
    logInfo(`URL: ${SUPABASE_URL}`);
    return supabase;
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return null;
  }
}

async function testTableStructure(supabase) {
  logSection("TEST 2: STRUCTURE DES TABLES");

  const requiredTables = [
    {
      name: "farmer_requests",
      requiredColumns: [
        "id",
        "user_id",
        "email",
        "farm_name",
        "location",
        "description",
        "phone",
        "website",
        "products",
        "status",
        "created_at",
        "updated_at",
      ],
    },
    {
      name: "listing",
      requiredColumns: [
        "id",
        "createdBy",
        "name",
        "email",
        "address",
        "lat",
        "lng",
        "active",
        "created_at",
        "updated_at",
      ],
    },
    {
      name: "products",
      requiredColumns: [
        "id",
        "listing_id",
        "name",
        "price",
        "active",
        "created_at",
      ],
    },
    {
      name: "profiles",
      requiredColumns: ["user_id", "created_at"],
    },
  ];

  let allTablesOK = true;

  for (const table of requiredTables) {
    logInfo(`\nVérification table: ${table.name}`);

    try {
      const { data, error } = await supabase
        .from(table.name)
        .select("*")
        .limit(1);

      if (error) {
        logError(`Table ${table.name} inaccessible: ${error.message}`);
        allTablesOK = false;
        continue;
      }

      logSuccess(`Table ${table.name} existe`);

      if (data && data.length > 0) {
        const existingColumns = Object.keys(data[0]);
        const missingColumns = table.requiredColumns.filter(
          (col) => !existingColumns.includes(col)
        );

        if (missingColumns.length > 0) {
          logWarning(`Colonnes manquantes: ${missingColumns.join(", ")}`);
          allTablesOK = false;
        } else {
          logSuccess(`Toutes les colonnes requises présentes`);
        }
      } else {
        logInfo(
          `Table ${table.name} vide - impossible de vérifier les colonnes`
        );
      }
    } catch (error) {
      logError(`Erreur: ${error.message}`);
      allTablesOK = false;
    }
  }

  if (allTablesOK) {
    logSuccess("\n✅ Structure des tables OK");
  } else {
    logWarning("\n⚠️  Certaines tables ont des problèmes");
  }

  return allTablesOK;
}

async function testAPI(method, endpoint, body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${APP_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.status === expectedStatus) {
      logSuccess(`API ${endpoint} - Status ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      logError(
        `API ${endpoint} - Expected ${expectedStatus}, got ${response.status}`
      );
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    logError(`API ${endpoint} - Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSubmitRequest() {
  logSection("TEST 3: API SUBMIT REQUEST (Step 1)");

  const result = await testAPI(
    "POST",
    "/api/onboarding/submit-request",
    {
      userId: TEST_DATA.userId,
      email: TEST_DATA.email,
      firstName: TEST_DATA.firstName,
      lastName: TEST_DATA.lastName,
      farmName: TEST_DATA.farmName,
      siret: TEST_DATA.siret,
      department: TEST_DATA.department,
    },
    201
  );

  if (result.success) {
    logInfo(`Request ID créé: ${result.data.requestId}`);
    return result.data.requestId;
  }

  return null;
}

async function testValidateRequest(supabase, requestId) {
  logSection("TEST 4: API VALIDATE FARMER REQUEST (Admin)");

  if (!requestId) {
    logWarning("Skip - Pas de requestId");
    return false;
  }

  logInfo("Simulation de la validation admin...");

  try {
    const { error } = await supabase
      .from("farmer_requests")
      .update({
        status: "approved",
        approved_by_admin_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      logError(`Erreur mise à jour: ${error.message}`);
      return false;
    }

    logSuccess("Demande marquée comme approved (simulation)");
    return true;
  } catch (error) {
    logError(`Exception: ${error.message}`);
    return false;
  }
}

async function testGenerateProfile(requestId) {
  logSection("TEST 5: API GENERATE PROFILE (Step 2)");

  if (!requestId) {
    logWarning("Skip - Pas de requestId");
    return null;
  }

  const result = await testAPI(
    "POST",
    "/api/onboarding/generate-profile",
    {
      requestId,
      story: TEST_DATA.story,
      website: TEST_DATA.website,
    },
    200
  );

  if (result.success) {
    logInfo("Profil généré:");
    console.log(JSON.stringify(result.data.data, null, 2));
    return result.data.data;
  }

  return null;
}

async function testCreateListing(requestId, generatedProfile) {
  logSection("TEST 6: API CREATE LISTING (Step 3)");

  if (!requestId || !generatedProfile) {
    logWarning("Skip - Données manquantes");
    return null;
  }

  const result = await testAPI(
    "POST",
    "/api/onboarding/create-listing",
    {
      requestId,
      userId: TEST_DATA.userId,
      email: TEST_DATA.email,
      farmProfile: generatedProfile.farmProfile,
      products: generatedProfile.products,
      enableOrders: true,
      publishFarm: true,
    },
    201
  );

  if (result.success) {
    logInfo(`Listing créé avec ID: ${result.data.listingId}`);
    return result.data.listingId;
  }

  return null;
}

async function verifyDatabaseState(supabase, requestId, listingId) {
  logSection("TEST 7: VÉRIFICATION ÉTAT BASE DE DONNÉES");

  if (!requestId) {
    logWarning("Skip - Pas de requestId");
    return;
  }

  // Vérifier farmer_request
  logInfo("\n1. Vérification farmer_requests");
  const { data: request, error: requestError } = await supabase
    .from("farmer_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError) {
    logError(`Erreur: ${requestError.message}`);
  } else {
    logSuccess(`Request trouvée - Status: ${request.status}`);
    logInfo(`Farm: ${request.farm_name}`);
    logInfo(`Email: ${request.email}`);
  }

  // Vérifier listing si créé
  if (listingId) {
    logInfo("\n2. Vérification listing");
    const { data: listing, error: listingError } = await supabase
      .from("listing")
      .select("*")
      .eq("id", listingId)
      .single();

    if (listingError) {
      logError(`Erreur: ${listingError.message}`);
    } else {
      logSuccess(`Listing trouvé - Active: ${listing.active}`);
      logInfo(`Name: ${listing.name}`);
      logInfo(`Email: ${listing.email}`);
    }

    // Vérifier produits
    logInfo("\n3. Vérification products");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("listing_id", listingId);

    if (productsError) {
      logError(`Erreur: ${productsError.message}`);
    } else if (products && products.length > 0) {
      logSuccess(`${products.length} produit(s) trouvé(s)`);
      products.forEach((p) => {
        logInfo(`- ${p.name}: ${p.price}€/${p.unit || "kg"}`);
      });
    } else {
      logWarning("Aucun produit trouvé");
    }
  }
}

function generateReport(results) {
  logSection("📊 RAPPORT FINAL");

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter((r) => r === true).length;
  const failed = total - passed;

  console.log("\nRésumé:");
  logSuccess(`Tests réussis: ${passed}/${total}`);
  if (failed > 0) {
    logError(`Tests échoués: ${failed}/${total}`);
  }

  console.log("\nDétails:");
  Object.entries(results).forEach(([test, result]) => {
    if (result) {
      logSuccess(`${test}`);
    } else {
      logError(`${test}`);
    }
  });

  if (failed === 0) {
    console.log("\n" + "🎉".repeat(30));
    logSuccess("TOUS LES TESTS SONT PASSÉS !");
    console.log("🎉".repeat(30) + "\n");
  } else {
    console.log("\n" + "⚠️ ".repeat(20));
    logWarning("CERTAINS TESTS ONT ÉCHOUÉ - Vérifiez les logs ci-dessus");
    console.log("⚠️ ".repeat(20) + "\n");
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("\n");
  log("🧪 FARM2FORK - TEST SUITE ONBOARDING", "bright");
  log("=====================================\n", "bright");

  const results = {};
  let requestId = null;
  let listingId = null;
  let generatedProfile = null;

  // Test 1: Connexion
  const supabase = await testSupabaseConnection();
  results["Connexion Supabase"] = supabase !== null;

  if (!supabase) {
    logError("\n❌ Impossible de continuer sans connexion Supabase");
    generateReport(results);
    process.exit(1);
  }

  // Test 2: Structure tables
  const tablesOK = await testTableStructure(supabase);
  results["Structure des tables"] = tablesOK;

  // Test 3: Submit request
  requestId = await testSubmitRequest();
  results["API submit-request"] = requestId !== null;

  // Test 4: Validate request (simulation)
  if (requestId) {
    const validated = await testValidateRequest(supabase, requestId);
    results["Validation demande"] = validated;
  }

  // Test 5: Generate profile
  if (requestId) {
    generatedProfile = await testGenerateProfile(requestId);
    results["API generate-profile"] = generatedProfile !== null;
  }

  // Test 6: Create listing
  if (requestId && generatedProfile) {
    listingId = await testCreateListing(requestId, generatedProfile);
    results["API create-listing"] = listingId !== null;
  }

  // Test 7: Verify DB state
  await verifyDatabaseState(supabase, requestId, listingId);

  // Rapport final
  generateReport(results);

  // Info nettoyage
  if (requestId) {
    logInfo("\nDonnées de test créées:");
    logInfo(`- farmer_requests.id = ${requestId}`);
    if (listingId) {
      logInfo(`- listing.id = ${listingId}`);
    }
    logInfo("\nPour nettoyer: exécuter cleanup-test-data.sql dans Supabase");
  }
}

// Exécution
main().catch((error) => {
  logError(`\n💥 Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});
