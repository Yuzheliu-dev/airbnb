## Overall Testing Strategy

- Toolchain: Plan to use **Vitest + React Testing Library** (`npm run test`) for component unit testing, simulating the DOM environment via jsdom; UI testing will simulate full user flows on the same stack.  
- Data: External dependencies (auth/listings/bookings API) will be mocked using `vi.mock` for lightweight memory injection, avoiding real network requests.  
- State: Testing implementation is ongoing; test cases below will be completed incrementally. Until full coverage is achieved, manual smoke tests will be performed after each feature completion following the sequence: “Register → Listing → Search → Booking”.

## Component Testing (3+ planned use cases)

1. **`Common/Notification`**  
   - Assert error/success notifications render title, body, and close button;  
   - Calling close button triggers `onClose` and removes it from DOM.
2. **`LoginPage`**  
   - After entering email/ password and clicking submit invokes `login(email.trim(), password)` and redirects to `location.state.from`;  
   - When API errors occur, the error message displays within `ErrorNotification`.
3. **`RegisterPage`**  
   - When password & confirm password mismatch, prevent submission and display “Passwords do not match.”;  
   - After successful registration, calls `register` and navigates to `/`.
4. **(Optional) `HostedListingsPage` Form**  
   - After uploading a JSON file, fields are mapped to corresponding input fields;  
   - Field validation (price > 0, complete address) correctly prevents submission.

## Administrator Happy Path UI Testing

A single test will simulate the workflow required by spec 2.8, covering the following steps:

1. Register a new account and verify the email appears in the navigation bar.  
2. Navigate to “Hosted Listings” → Create a new listing.  
3. Edit the listing title/thumbnail.  
4. Add available dates and publish; then unpublish → republish.  
5. Return to `All Listings`, enter the details page, and initiate a booking.  
6. Log out → log back in to verify session persistence.  

The test will mock the API and track state changes, ensuring corresponding prompts (success/error/status labels, etc.) appear on the page at each step.

Translated with DeepL.com (free version)