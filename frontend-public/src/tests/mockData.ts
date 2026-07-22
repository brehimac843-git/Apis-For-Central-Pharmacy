/**
 * Test Data for Dashboard Component
 * Contains mock pharmacy and medication data for testing scenarios
 * Based on pharmaceutical hub use cases from project rapport
 */

export const MOCK_PHARMACIES = [
  {
    pharmacy: "Pharmacie du Centre",
    city: "Bamako",
    latitude: 12.6452,
    longitude: -8.0029,
    price: 500,
    stock: 45,
    amo_supported: true,
    amo_rate: 80,
  },
  {
    pharmacy: "Pharmacie Santé Plus",
    city: "Bamako",
    latitude: 12.5897,
    longitude: -7.9944,
    price: 600,
    stock: 32,
    amo_supported: false,
    amo_rate: null,
  },
  {
    pharmacy: "Pharmacie Centrale",
    city: "Bamako",
    latitude: 12.6555,
    longitude: -8.0101,
    price: 550,
    stock: 78,
    amo_supported: true,
    amo_rate: 85,
  },
  {
    pharmacy: "Pharmacie Moderne",
    city: "Bamako",
    latitude: 12.5601,
    longitude: -7.9876,
    price: 480,
    stock: 15,
    amo_supported: true,
    amo_rate: 75,
  },
  {
    pharmacy: "Pharmacie Générale",
    city: "Bamako",
    latitude: 12.6789,
    longitude: -8.0234,
    price: 1600,
    stock: 22,
    amo_supported: false,
    amo_rate: null,
  },
];

export const MOCK_CATALOG_DRUGS = [
  {
    name: "Paracétamol",
    category: "Douleurs/Fièvre",
    minPrice: 480,
    availableAt: 5,
    description: "Antalgique et antipyrétique pour traiter la douleur et la fièvre",
  },
  {
    name: "Ibuprofène",
    category: "Anti-inflammatoires",
    minPrice: 800,
    availableAt: 4,
    description: "Anti-inflammatoire non-stéroïdien (AINS)",
  },
  {
    name: "Metformine",
    category: "Diabète",
    minPrice: 1200,
    availableAt: 3,
    description: "Traitement du diabète de type 2",
  },
  {
    name: "Amoxicilline",
    category: "Antibiotiques",
    minPrice: 2500,
    availableAt: 4,
    description: "Antibiotique à large spectre",
  },
  {
    name: "Aspirine",
    category: "Cardiologie",
    minPrice: 300,
    availableAt: 5,
    description: "Anticoagulant et antiagrégant plaquettaire",
  },
];

export const MOCK_SEARCH_HISTORY = [
  {
    id: "history_1",
    query: "Paracétamol",
    type: "single" as const,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "history_2",
    query: "Metformine",
    type: "single" as const,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "history_3",
    query: "Paracétamol, Ibuprofène",
    type: "bulk" as const,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const MOCK_SUGGESTIONS = [
  "Paracétamol",
  "Paracétamol 500mg",
  "Paracétamol-Codéine",
];

export const MOCK_USER_LOCATION = {
  latitude: 12.6452,
  longitude: -8.0029,
};

/**
 * Test Scenarios for Dashboard
 *
 * SCENARIO 1: Search for Medication (Nominal)
 * - User enters "Paracétamol"
 * - Expected: 5 results from MOCK_PHARMACIES with varying prices
 * - Verify distance calculations from user location
 * - Test both grid and list view toggle
 *
 * SCENARIO 2: Catalog Browse
 * - User clicks "Afficher le catalogue"
 * - Expected: MOCK_CATALOG_DRUGS displayed in card grid
 * - Test category filtering and sorting
 * - Verify click navigation to drug detail page
 *
 * SCENARIO 3: Price Comparison
 * - User searches "Paracétamol" and sees results
 * - Apply "Uniquement AMO" filter
 * - Expected: Only 3 pharmacies with AMO support shown
 * - Apply "Plus proche d'abord" sort
 * - Expected: Results ordered by distance from user location
 *
 * SCENARIO 4: Bulk Search
 * - User clicks "Recherche groupée"
 * - Enter: "Paracétamol, Ibuprofène"
 * - Expected: Results for both medications displayed
 *
 * SCENARIO 5: Search History
 * - User navigates to history view
 * - Expected: MOCK_SEARCH_HISTORY items displayed
 * - Test delete single item
 * - Test clear all history with confirmation
 * - Test rerun search from history
 *
 * SCENARIO 6: No Results Exception
 * - User searches for non-existent medication "InvalidDrugXYZ"
 * - Expected: Empty results message displayed
 * - Suggestion to try different search
 *
 * SCENARIO 7: Geolocation Disabled
 * - User denies geolocation permission
 * - Expected: Results without distance information
 * - Sort by distance disabled or shows warning
 * - Displays "Distance indisponible"
 */

/**
 * Testing Instructions:
 *
 * 1. Mock Mode (for development/testing):
 *    - Set environment variable: REACT_APP_MOCK_DATA=true
 *    - Dashboard will use MOCK_PHARMACIES instead of API calls
 *
 * 2. API Integration Testing:
 *    - Ensure these endpoints are available:
 *      * GET /api/suggestions?q={query}
 *      * GET /api/aggregate-stock/{drugName}
 *      * GET/POST/DELETE /api/public/history*
 *
 * 3. Manual Testing Checklist:
 *    - [ ] Search with empty query
 *    - [ ] Search with special characters
 *    - [ ] Search without geolocation
 *    - [ ] Toggle between grid/list views
 *    - [ ] Apply AMO filter with no results
 *    - [ ] Sort by distance with multiple results
 *    - [ ] Add/remove from history
 *    - [ ] Test on mobile viewport
 *    - [ ] Test keyboard navigation
 *    - [ ] Test suggestion selection with Enter key
 */
