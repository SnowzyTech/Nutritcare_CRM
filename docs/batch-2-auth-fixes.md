Read the current signup page and auth flow. Make these changes:

Remove Delivery Agent from the signup role dropdown — delivery agents should not be able to sign up as system users
Add profile picture upload to the signup form — add an image upload field that stores the avatar. For now, upload to /public/uploads/avatars/ and save the path to the User's avatarUrl field. Keep it simple — no external storage service yet.
Add warehouse selection to signup — when a user selects the WAREHOUSE_MANAGER role during signup, show an additional dropdown that lists all warehouses from the database. Save the selected warehouse to the User's warehouseId field.
Add team selection to signup — when a user selects the SALES_REP role during signup, show a dropdown listing available sales teams. Save the selected team to the User's teamId field.
Force password change for delivery agents — this item is no longer applicable since delivery agents won't sign up. Skip this.

After making changes, test that the signup form works correctly for each role — SALES_REP shows team selection, WAREHOUSE_MANAGER shows warehouse selection, all roles show the avatar upload.