建议直接在当前 Figma Make 对话中粘贴下面这段。它会要求 Make **基于现有 Demo 增量修改，不要重新设计整个页面**。

Continue improving the existing Inventory prototype. Do not rebuild the application from scratch and do not change the established visual style, sidebar navigation, typography, colors, spacing system, or existing sample data unless required by the changes below.

Focus on completing the Inventory MVP workflows and making the prototype interactions functional.

## 1. Inventory navigation

Keep Inventory as one main navigation section with two internal tabs:

* Items
* Activity

Activity must remain an internal Inventory tab, not a separate item in the main sidebar.

## 2. Inventory Items table

Keep the existing search, category filter, status filter, and inventory table.

Add:

* A checkbox on each row
* A “Select All” checkbox in the table header
* A contextual bulk action bar when one or more items are selected
* Bulk action: “Add to Purchase List”
* Sort options for Product, Quantity, Status, and Last Updated
* A clickable Product Name that opens Inventory Item Details
* Last Updated column if space allows

Search should actually support:

* Product Name
* MFG Number
* Barcode

Fix the empty filtered result and pagination logic. Never display states such as “Page 1 of 0” or “Showing 1–0”.

Keep these inventory status rules:

* Quantity = 0 → Out of Stock
* Quantity ≤ Minimum Quantity → Low Stock
* Quantity > Minimum Quantity → In Stock

Replace the separate “Reorder Point” and “Low Stock Alert” fields with one field:

* Minimum Quantity

## 3. Inventory Item Details

Create a right-side Inventory Item Details drawer on desktop. Clicking a Product Name opens the drawer.

The drawer should include:

### Product Information — read-only

* Product Name
* Brand
* Category
* MFG Number
* Barcode
* Unit
* Product image, if available

### Clinic Inventory Information

* Current Quantity
* Inventory Status
* Minimum Quantity
* Location
* Vendor
* Purchase Price
* Expiry information, if applicable

### Primary actions

* Adjust Quantity
* Add to Purchase List
* Edit Inventory Information
* View Inventory Activity

Do not display the Activity history list inside this drawer. Activity must remain in the Inventory → Activity tab as the single source of truth.

## 4. Adjust Quantity workflow

Replace the current single “New Quantity” interaction with an Adjust Quantity modal containing a segmented control:

* Increase
* Decrease
* Set Quantity

Example behavior when Current Quantity is 10:

* Increase by 5 → New Quantity 15
* Decrease by 3 → New Quantity 7
* Set Quantity to 8 → New Quantity 8

The modal must show:

* Current Quantity
* Selected adjustment method
* Quantity input
* New Quantity preview
* Adjustment Reason
* Optional Note
* Cancel
* Save Adjustment

Make Adjustment Reason required. Suggested reasons may include:

* New stock received
* Product used
* Damaged or expired
* Physical stock count correction
* Data correction
* Other

Validation rules:

* Quantity cannot be blank
* Increase and Decrease values must be greater than 0
* Decrease cannot result in inventory below 0
* Set Quantity can be 0 but cannot be negative
* Prevent invalid decimals when the product unit only supports whole numbers
* Prevent unrealistic or excessively large values
* Display inline validation messages

After saving:

* Update the inventory quantity and status
* Create a corresponding Activity record
* Close the modal
* Show a success toast

## 5. Edit Inventory Information

Make “Edit Inventory Information” functional.

Open an edit modal or drawer that allows clinic users to edit only clinic-level inventory fields:

* Minimum Quantity
* Location
* Vendor
* Purchase Price
* Expiry information
* Internal Note

Standard Product Library identity fields must remain read-only:

* Product Name
* Brand
* Category
* Manufacturer
* MFG Number
* Barcode
* Standard Unit

After saving:

* Update the Inventory Item Details
* Add an “Item Edited” Activity record
* Show a success toast

## 6. Add to Purchase List

Make “Add to Purchase List” functional for both:

* A single inventory item
* Multiple selected inventory items

Open a modal showing all Active Purchase Lists.

Requirements:

* Allow users to select one or multiple Active Purchase Lists
* One product may be added to multiple Active Purchase Lists
* Show the selected product or number of selected products
* Allow the user to create a new Purchase List without leaving the current workflow
* After creating a new list, automatically select it
* If there are no Active Purchase Lists, show an empty state with “Create New Purchase List”

If a product already exists in the selected list, do not silently create a duplicate row. Show that it has already been added and use a clear merge/update behavior.

After completion, show a success message stating how many products were added and to which list or lists.

## 7. View Inventory Activity

Make “View Inventory Activity” functional.

When selected from an inventory row or the Item Details drawer:

1. Close the current menu or drawer
2. Switch from Items to the Activity tab
3. Automatically apply the selected Product as a Product filter
4. Display only Activity records related to that product
5. Show the active Product filter as a removable filter chip

Do not navigate to a separate Activity page.

## 8. Activity tab

Keep the existing Activity table, but expand it to support these activity types:

* Increase
* Decrease
* Set Quantity
* Item Added
* Item Edited
* Item Removed or Archived
* Import Adjustment

Each Activity record should display:

* Date and Time
* Product
* Action
* Previous Quantity
* Change
* New Quantity
* Reason
* Performed By

For non-quantity events such as Item Edited, use appropriate values such as “—” instead of misleading quantity changes.

Add functional structured filters for:

* Product
* Action
* User
* Date Range

Keep keyword search, but do not use keyword search as a replacement for the structured Product filter.

## 9. Add Inventory Item

Keep Add Inventory Item as a Large Modal on desktop.

Change its top section to two directly accessible tabs:

* Search Library
* Manual Entry

Users must be able to enter Manual Entry directly without first producing a “No Results” state.

### Search Library tab

* Search by Product Name, MFG Number, or Barcode
* Select an existing Product Library product
* Display Product Library information as read-only
* Enter clinic inventory settings separately
* Detect whether the product already exists in the current clinic’s inventory

If the selected product already exists, prevent duplicate creation and show:

“This product is already in your inventory.”

Provide the action:

“Adjust Quantity Instead”

### Manual Entry tab

Allow the user to create a product that is not found in the Product Library. Clearly separate:

* New product identity information
* Clinic inventory information

Add helper text explaining that manually entered products may require future review or standardization.

### Clinic inventory fields

Use:

* Current Quantity
* Minimum Quantity
* Location
* Vendor
* Purchase Price
* Expiry information, if applicable

Remove the conceptual duplication between Reorder Point and Low Stock Alert.

After saving:

* Add the item to Inventory
* Create an “Item Added” Activity record
* Show a success toast

For the mobile version, include a Barcode / QR Scan entry point. It can be represented as a functional prototype entry without implementing real camera scanning.

## 10. Remove from Inventory

Make “Remove from Inventory” functional.

Use a confirmation modal that explains:

* The item will be removed or archived from the active Inventory list
* Historical Activity records will be retained
* This action does not delete the standard product from the Product Library

Require explicit confirmation.

After confirmation:

* Remove or archive the item from the active Inventory Items table
* Keep its historical Activity records
* Add an “Item Removed” or “Item Archived” Activity event
* Show a success toast

## 11. UI states and feedback

Add appropriate states for the Inventory experience:

* True empty Inventory state
* No search results
* No filter results
* Loading state
* Save in progress
* Inline form validation
* Error state
* Save success toast
* Confirmation dialogs for destructive actions

Use realistic sample data and ensure all prototype buttons, menus, tabs, filters, modals, drawers, and save actions visibly work.

## 12. Responsive behavior

Keep the current desktop layout.

For mobile:

* Replace the fixed desktop sidebar with the established mobile navigation pattern
* Convert large modals and right-side drawers into full-screen mobile sheets or pages
* Keep primary actions reachable without horizontal scrolling
* Use mobile-friendly cards or a responsive table alternative

## 13. MVP scope

Move “Import Inventory History” out of the primary Inventory MVP workflow.

Either:

* Remove it from the current interface, or
* Label it clearly as “Coming Later”

Do not expand invoice, CSV, Excel, or AI parsing workflows in this iteration.

Prioritize completing these six functional MVP workflows:

1. Add Inventory Item
2. Inventory Item Details
3. Edit Inventory Information
4. Adjust Quantity
5. Add to Purchase List
6. View and filter Inventory Activity

Preserve the existing visual design and improve the current prototype incrementally. Do not introduce unrelated dashboards, analytics, purchasing workflows, or new main navigation sections.
