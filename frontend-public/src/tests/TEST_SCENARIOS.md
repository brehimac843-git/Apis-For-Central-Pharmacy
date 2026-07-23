# Dashboard Test Scenarios

Based on rapport specifications and pharmaceutical hub use cases adapted to the public frontend Dashboard component.

---

## 1. Rechercher Médicament (Search for Medication)

### Objective
Allow users to search for medications and view available options across partner pharmacies.

### Primary Actors
- User (authenticated or guest)

### Preconditions
- User has access to the Dashboard component
- At least one pharmacy with stock data is available in the system

### Postconditions
- Search results are displayed showing available pharmacies for the medication
- Results include price, distance, stock status, and AMO support information

### Nominal Scenario

**Steps:**
1. User accesses the Dashboard search page
2. User enters medication name in the search field (e.g., "Paracétamol", "Antibiotique")
3. System displays suggestions based on real-time data from API (`/api/suggestions?q=...`)
4. User selects a suggestion or presses Enter
5. System fetches results from `/api/aggregate-stock/{drugName}`
6. Results are displayed with:
   - Pharmacy name and city
   - Price in FCFA
   - Distance (if geolocation available)
   - Stock availability status
   - AMO support indicator (if applicable)
7. User can toggle between Grid and List views
8. User can apply filters (distance sort, AMO only)
9. User can click on a pharmacy to view detailed information

### Exception Scenarios

**E1: No medication found**
- User searches for a non-existent medication
- System displays message: "No results found for '{query}'"
- Suggests trying a different search term

**E2: No geolocation permission**
- User denies geolocation access
- System displays results without distance information
- Sort by distance button is disabled or shows warning
- Results show "Distance indisponible"

**E3: API error during search**
- Backend API returns error
- System displays error notification
- User can retry the search

### Test Data Examples

```
Search Query: "Paracétamol"
Expected Results:
- Pharmacie du Centre (Bamako) - 500 FCFA - 2.5 km - AMO supported
- Pharmacie Centrale (Bamako) - 550 FCFA - 3.1 km - AMO supported  
- Pharmacie Santé Plus (Bamako) - 600 FCFA - 5.2 km - No AMO

Search Query: "Metformine"
Expected Results:
- Pharmacie Moderne (Bamako) - 1500 FCFA - 1.8 km - AMO supported
- Pharmacie Générale (Bamako) - 1600 FCFA - 4.3 km - No AMO
```

---

## 2. Consulter le Catalogue (View Catalog)

### Objective
Allow users to browse the complete catalog of available medications without needing to search.

### Primary Actors
- User (authenticated or guest - no login required)

### Preconditions
- Catalog component is accessible
- Catalog database is populated with medications

### Postconditions
- Catalog list is displayed with all available medications
- User can view medication details, prices, and availability

### Nominal Scenario

**Steps:**
1. User accesses the Dashboard
2. User clicks "Afficher le catalogue" or navigates to catalogue view
3. System loads medications from backend via Catalogue component
4. Results display in card grid with:
   - Drug name
   - Category (with emoji indicators: 🦟 Malaria, 💊 Antibiotics, etc.)
   - Star ratings and review counts
   - Min/Max price range
   - Number of pharmacies carrying the item
   - Stock status (color-coded)
5. User can:
   - Search within catalog
   - Filter by category
   - Sort by popularity, price, or availability
   - Click on a medication to view details
6. Clicking a medication navigates to DrugDetail component
7. User can search for that drug from the detail page

### Exception Scenarios

**E1: Empty catalog**
- No medications are available
- System displays message: "Catalog is empty"
- Suggests checking back later

**E2: Category filter unavailable**
- Category filter fails to load
- System disables filter option
- All items display without category filtering

### Test Data Examples

```
Catalog Items:
- Paracétamol (Douleurs/Fièvre)
  Category: 💊 Antibiotics
  Min Price: 500 FCFA
  Rating: ⭐⭐⭐⭐⭐ (4.8/5, 24 reviews)
  Available in 12 pharmacies
  Status: In Stock (green)

- Metformine (Diabète)
  Category: 🩺 Chronic Diseases  
  Min Price: 1200 FCFA
  Rating: ⭐⭐⭐⭐ (4.2/5, 15 reviews)
  Available in 8 pharmacies
  Status: In Stock (green)

- Aspirine (Cardiologie)
  Category: ❤️ Cardiology
  Min Price: 300 FCFA
  Rating: ⭐⭐⭐⭐⭐ (4.9/5, 42 reviews)
  Available in 15 pharmacies
  Status: In Stock (green)
```

---

## 3. Comparer Prix (Compare Prices)

### Objective
Enable users to compare medication prices across multiple pharmacies to find the best deals.

### Primary Actors
- Authenticated User (login required for price comparison history)

### Preconditions
- User is logged in
- User has searched for or selected a medication
- Multiple pharmacies carry the medication

### Postconditions
- Price comparison is displayed
- Comparison results are saved to search history

### Nominal Scenario

**Steps:**
1. User performs a medication search (e.g., "Paracétamol")
2. System displays results with prices from multiple pharmacies
3. Results are displayed sorted by distance (closest first)
4. User can see price, location, distance, and AMO support for each pharmacy
5. User can click "Voir les détails" to view pharmacy details
6. System automatically saves search to history for registered users
7. User can apply filters:
   - Sort by closest/furthest distance
   - Filter "Uniquement AMO" to show only AMO-supported pharmacies
8. User can switch between Grid and List views to compare better

### Exception Scenarios

**E1: Same price everywhere**
- User searches for medication with identical prices at all pharmacies
- System displays all results with equal prices
- System displays notification: "No significant price variation found"
- User can still filter by distance or AMO support

**E2: Only one pharmacy carries the medication**
- Search returns single result
- System displays single pharmacy option
- Comparison is not meaningful, but user can still view details

**E3: AMO filter removes all results**
- User enables "Uniquement AMO" filter
- No pharmacies support AMO for that medication
- System displays message: "No AMO-supported pharmacies found for this medication"
- Suggestion to remove AMO filter

### Test Data Examples

```
Search Query: "Paracétamol"

Price Comparison Results:
─────────────────────────────────────────────────────────────
Rank | Pharmacy Name          | Price  | Distance | AMO    | City
─────────────────────────────────────────────────────────────
1.   | Pharmacie du Centre    | 500 F  | 2.5 km   | ✓ YES  | Bamako
2.   | Pharmacie Santé Plus   | 600 F  | 5.2 km   | ✗ NO   | Bamako
3.   | Pharmacie Centrale     | 550 F  | 3.1 km   | ✓ YES  | Bamako
─────────────────────────────────────────────────────────────
Savings: User could save 100 FCFA by choosing Pharmacie du Centre

Filter Applied: "Uniquement AMO"
Results after filtering:
- Pharmacie du Centre (500 FCFA, 2.5 km)
- Pharmacie Centrale (550 FCFA, 3.1 km)
```

---

## 4. Bulk Search (Recherche Groupée)

### Objective  
Allow users to search for multiple medications in a single query for convenient pharmacy comparison.

### Primary Actors
- User (authenticated or guest)

### Preconditions
- User has access to the bulk search modal

### Postconditions
- Bulk search results are displayed for all queried medications
- Results can be saved to search history

### Nominal Scenario

**Steps:**
1. User clicks "Recherche groupée" button
2. BulkSearchModal opens
3. User enters multiple medication names (comma-separated)
4. User enters quantity for each medication (optional)
5. User submits the bulk search
6. System queries each medication individually
7. Results aggregate and display for all medications
8. User can view:
   - All medications in one view
   - Pharmacies carrying each medication
   - Price comparison for each medication
   - Optimal pharmacy suggestions
9. For registered users, bulk search is saved to history with timestamp

### Exception Scenarios

**E1: Mixed results (some medications found, some not)**
- Some medications are available, others are not
- System displays found medications with results
- Unavailable medications show "Not available" status
- User can retry search

**E2: Empty bulk search input**
- User submits without entering medication names
- System displays validation message
- Modal stays open for user to add medications

---

## 5. Search History Management

### Objective
Allow users to manage and review their previous searches.

### Primary Actors
- Authenticated User (requires login)

### Preconditions
- User is logged in
- User has performed at least one search

### Postconditions
- Search history is displayed
- History can be cleared or individual items deleted
- User can rerun previous searches

### Nominal Scenario

**Steps:**
1. User navigates to "Historique" (History)
2. System displays list of previous searches with timestamps
3. Each history item shows:
   - Search type (single or bulk)
   - Medication/Query name
   - Date/time of search
4. User can:
   - Click a search to run it again
   - Click delete icon to remove individual entry
   - Click "Effacer l'historique" to clear all history
5. Confirmation dialog appears for delete/clear actions
6. After confirmation, history is updated

### Exception Scenarios

**E1: Empty history**
- User has no previous searches
- System displays empty state message
- Clear history button is disabled

**E2: Guest user**
- Guest user tries to access history
- System redirects to search page
- No history is saved for guests

### Test Data Examples

```
Search History (Last 10):
─────────────────────────────────────────────────────────────
Date       | Type        | Query              | Action
─────────────────────────────────────────────────────────────
2026-06-27 | Single      | Paracétamol        | [Delete]
2026-06-27 | Bulk        | Paracétamol, Ibup. | [Delete] [Details]
2026-06-26 | Single      | Metformine         | [Delete]
2026-06-26 | Single      | Amoxicilline       | [Delete]
2026-06-25 | Bulk        | Antibiotics        | [Delete] [Details]
─────────────────────────────────────────────────────────────
[Clear All History]
```

---

## Test Execution Checklist

- [ ] Test 1.1: Basic medication search
- [ ] Test 1.2: Search with no results
- [ ] Test 1.3: Search with geolocation enabled
- [ ] Test 1.4: Search with geolocation disabled
- [ ] Test 2.1: Load catalog without search
- [ ] Test 2.2: Filter catalog by category
- [ ] Test 2.3: Sort catalog by price
- [ ] Test 2.4: Click medication to view details
- [ ] Test 3.1: Compare prices for single medication
- [ ] Test 3.2: Filter results by distance (closest first)
- [ ] Test 3.3: Filter results by distance (furthest first)
- [ ] Test 3.4: Filter by "Uniquement AMO"
- [ ] Test 3.5: Toggle between Grid and List views
- [ ] Test 4.1: Bulk search with multiple medications
- [ ] Test 4.2: Bulk search with mixed results
- [ ] Test 5.1: View search history
- [ ] Test 5.2: Delete single history item
- [ ] Test 5.3: Clear all history
- [ ] Test 5.4: Rerun search from history

---

## API Endpoints Used in Dashboard

```
GET  /api/suggestions?q={query}                    - Get search suggestions
GET  /api/aggregate-stock/{drugName}               - Get search results
POST /api/public/history                           - Save search to history
POST /api/public/history/bulk                      - Save bulk search to history  
GET  /api/public/history                           - Get search history
GET  /api/public/history/{id}                      - Get history details
DELETE /api/public/history/{id}                    - Delete history item
DELETE /api/public/history                         - Clear all history
```

---

## Responsive Behavior Tests

- [ ] Desktop view (1920px): All features functional
- [ ] Tablet view (768px): Layout stacks properly, all buttons accessible
- [ ] Mobile view (375px): Search bar full-width, buttons stack, touch targets >= 44px
- [ ] Filter dropdown accessible on mobile
- [ ] Results grid converts to list view on mobile

---

## Accessibility Tests

- [ ] Keyboard navigation through suggestions
- [ ] Screen reader announces search results count
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG AA standards
- [ ] All icons have proper aria-labels

