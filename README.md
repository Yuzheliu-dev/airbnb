# Assessment 4 - ReactJS: AirBrB 🏠

This assignment is due _Friday 21st November, 10pm_.

1. Background & Motivation
2. The Task (Frontend)
3. The Support (Backend)
4. Constraints & Assumptions
5. Teamwork
6. Marking Criteria
7. Originality of Work
8. Submission
9. Late Submission Policy

## 0. Change Log

28/10/25 - Due date typo was updated (wrong day, correct date)

18/11/25 - Added clarifications for ascending/descending sort order

## Compulsory setup

Please run ./util/setup.sh in your terminal before you begin. This will set up some checks in relation to the "Git Commit Requirements". If you ran this script before the MR rolled out specified in changelog, please run it again.
It's important to note that you should **NOT** use any pre-built web app templates or any AI web app creators for this assignment.

## 2. Your Task - Airbrb

You (and potentially a friend) are to build a frontend for a provided backend. This frontend shall be built with ReactJS. It shall be a single page application that does not require a refresh for state updates (Failure to make your app a fully single page app will result in significant mark penalties).

Features need to be implemented (described below) in order for your ReactJS app to meet the requirements of the task, and to operate with the backend described in 3.2.

1. Anything marked 🙉🙉🙉 only needs to completed by pair-attempts and not individual-attempts. Individual-attempts of pair-features may be eligible for bonus marks [refer to 6. Marking Criteria](#6-marking-criteria)

2. The requirements describe a series of **screens**. Screens can be popups/modals, or entire pages. The use of that language is so that you can choose how you want it to be displayed. A screen is essentially a certain state of your web-based application.

3. All success/error/warning messages shown to users should use appropriate UI components, you are not allowed to use alert throughout this assignment.

**Note**: This assignment, _unlike assignment 3_, has a lot of functionality available whilst not logged in. Logging in just adds extra functionality. If you're unsure what we mean by this behaviour, you can play around with the Airbnb website for comparison.

### 2.1. Feature Set 1. Admin Auth (5%)

This focuses on the basic user interface to register and log in to the site. Login and registration are required to gain access to making bookings as a guest, leave reviews and to manage your own listings as a host.

#### 2.1.1. Login Screen

- A unique route must exist for this screen
- User must be able to enter their `email` and `password`.
- If the form submission fails, a reasonable error message is shown
- A button must exist to allow submission of form
- The form must be able to be submitted on enter key in any of the fields

#### 2.1.2. Register Screen

- A unique route must exist for this screen
- User must be able to enter their `email` and `password` and `name`
- A confirm `password` field should exist where user re-enters their password.
- If the two passwords don't match, the user should receive an error popup before submission.
- If the form submission fails, a reasonable error message is shown
- A button must exist to allow submission of form
- The form must be able to be submitted on enter key in any of the fields

#### 2.1.3. Logout Button

- A logout button, when clicked, logs you out and returns you to the landing screen.

#### 2.1.4. Items on all screens

- On all screens, for a user who is logged in / authorised:
  - The logout button exists somewhere
  - A button exists that will take the user to the screen to view their hosted listings.
  - A button exists that will take the user to the screen to view all listings.

### 2.2. Feature Set 2. Creating & Editing & Publishing a Hosted Listing (11%)

For logged in users, they are able to create their own listings (as a host) that will become visible to all other users who have the option of booking it.

#### 2.2.1. Hosted Listings Screen

- A unique route must exist for this screen
- A screen of all of YOUR listings (that you created) is displayed, where each listing shows the:

  - Title
  - Property Type
  - Number of **beds** (not bedrooms)
  - Number of bathrooms
  - Thumbnail of the listing
  - SVG rating of the listing (based on user ratings)

    ![example](./assets/svg-example.png)

  - Number of total reviews
  - Price (per night)

- Each listing should have a clickable element relating to it that takes you to the screen to edit that particular listing (`2.2.3`).
- A button exists on this screen that allows you to delete a particular listing (this can be present for each listing)

#### 2.2.2. Hosted Listing Create

- On the hosted listing screen (`2.2.1`) a button should exist that allows you to create a new listing. When you click on it, you are taken to another screen that requires you to provide the following details:
  - Listing Title
  - Listing Address
  - Listing Price (per night)
  - Listing Thumbnail (use any default image, if not provided)
  - Property Type
  - Number of bathrooms on the property
  - Bedrooms in the property (e.g. each bedroom could include number of beds and their type)
  - Property amenities
- Using a button, a new listing on the server is created and visibly added to the dashboard (the Hosted Listings Screen) once all of the required fields have been filled out correctly.

#### 2.2.3 YouTube Listing Thumbnail 🙉🙉🙉

- For any given listing, add the option to use a playable YouTube video as the listing thumbnail. You should add a new field to the create/edit hosted listing screen to accept URL links, and this only needs to handle **embedded** youtube URLs.

#### 2.2.4. Edit AirBrB Listing

- A unique route must exist for this screen that is parameterised on the listing ID.
- The user should be able to edit the following:
  - Title
  - Address
  - Thumbnail
  - Price (per night)
  - Type
  - Number of bathrooms
  - Bedrooms (incorporate editing of beds as part of bedrooms)
  - Amenities
  - List of property images
- Updates can auto-save, or a save button can exist that saves the updates and returns you to the hosted listings screen.

#### 2.2.5. Publishing a listing

- For a listing to "go live" means that the listing becomes visible to other AirBrB users on the screen described in `2.4`.
- On the hosted listings screen described in `2.2.1`, add the ability to make an individual listing "go live".
  - A listing must have at least one availability date range (e.g. a listing could be available between 1st and 3rd of November and then between the 5th and 6th of November).
  - The way you define the availability ranges is entirely up to you. For example, you could use the following schemas:

```javascript
//Example 1:
availability: [{ start: date1, end: date2 }, { start: date3, end: date4 }, ...];
//Example 2:
availability: [date1, date2, date3, date4, ...];
```

- If the listing has more than 1 availability range, aggregate them on the frontend and submit them all to the backend in one go when publishing the listing. (You must handle multiple availablility-ranges for full marks in this section)

### 2.3. Feature Set 3. Landing Page: Listings and Search (9%)

When the app loads, regardless of whether a user is logged in or not, they can access the landing screen. The landing screen displays a number of listings that you as a guest may be able to book (on another screen). We recommend you create some listings (`2.2`) with one user account, and then create a second user account to build/test `2.3` so that you can view their listing as a potential booking option.

#### 2.3.1. Listings Screen

- A unique route must exist for this screen.
- This is the default screen that is loaded when a user accesses the root URL.
- This screen displays a list of all published listings (rows or thumbnails). The information displayed in each listing is:
  - Title
  - Thumbnail of property (or video if advanced)
  - Number of total reviews
  - (any more information you want, though that's optional).
- In terms of ordering of displayed published listings:
  - Listings that involve bookings made by the customer with status `accepted` or `pending` should appear first in the list (if the user is logged in).
  - All remaining listings should be displayed in alphabetical order of title.

#### 2.3.2. Search Filters

- On this listings screen, a search section must exist for the user to find and filter listings. You are only required to apply **one** of the filters described below at a time. You will need to handle **ascending** and **descending** order for each filter.
- The search section will consists of an input text box:
  - The input text box will take in a search string, and **by default** (without filters applied), find and display any listings whose title **or** city location match the query.
  - You are only required to do case insensitive substring matching (of each word in the search field), nothing more complicated.
- Other form inputs (filters) should also exist that allow the user to search by:
  - Number of bedrooms (a minimum and maximum number of bedrooms, expressed either via text fields or a slider)
    - Sort results from max to min beds **or** from min to max beds
  - Date range (two date fields) - only display bookings that are available for the entire date range as inputted by the user.
    - Sort not required
  - Price (a minimum and maximum price, expressed either via text fields or a slider)
    - Sort results from highest to lowest price **or** from lowest to highest price
  - Review ratings:
    - Sort results from highest to lowest review rating **or** from lowest to highest review rating
- For any sort applied, if there is more than one listing with the same value, the order does not matter
- The search section must have an associated search button that will action the search to reload the results given the new filters.

#### 2.3.3 Multiple search filters 🙉🙉🙉

- Extending from `2.3.2`, users must be able to apply more than one search filter at the same time (ie. number of bedrooms and price range).

- When multiple filters are applied, only listings that satisfy all selected filters should be displayed.
  - The system should maintain applied filters until the user resets or clears them.
- If multiple filters are applied, only sorting the result by alphabetical order is required
- If no listings match the combined filters, the results area should clearly show that no listings are available.

### 2.4. Feature Set 4. Viewing and Booking Listings (9%)

#### 2.4.1. View a Selected Listing

- A unique route must exist for this screen that is parameterised on the Listing ID
- For `2.3`, when a listing is clicked on, this screen should appear and display information about a specific listing.
- On this screen the user is given the listing they have decided to view in 2.4.1. This consists of:
  - Title
  - Address (displayed as a string, e.g. 1/101 Kensington Street, Kensington, NSW)
  - Amenities
  - Price:
    - If the user used a date range for search in `2.3.2` - display **price per stay**
    - If the user did not use a date range for search in `2.3.2` - display **price per night**
  - All images of the property including the listing thumbnail (they don't have to be visible all at once)
  - Type
  - Reviews
  - Review rating
  - Number of bedrooms
  - Number of beds
  - Number of bathrooms
- On this screen if the user is logged in and they have made booking for this listing, they should be able to see the status of their booking (see `2.4.2`).
- (Note: if the user has made more than 1 booking for a listing, display the status of all the bookings)

#### 2.4.2. Making a booking and checking its status

- On the screen described in `2.4.1`, a **logged in** user should be able to make a booking for a given listing they are viewing between the dates they are after. The user enters two dates (this includes day, month and year), and assume the dates describe a valid booking, a button allows for the confirmation of the booking.
- A user can make an unlimited number of bookings per listing even on overlapping date ranges and even if other users have already booked the property for those dates. It is up to the host to check if they have double booked their listing and accept/deny the bookings accordingly.
- A booking's length (in days) is defined based on _how many nights_ a user spends at the listed property (this is how bookings are defined on all modern accommodation platforms). For example, a booking from the 15th to the 17th of November consists of 2 days in length - 15th to the 16th and 16th to the 17th.
- Once a booking is made, the user receives some kind of temporary confirmation on screen.

#### 2.4.3 Leaving a listing review

- A logged in user should be able to leave a review for listings they've booked that will immidiately appear on the listing screen after it's been posted by the user. The review will consist of a score (number) and a comment (text). You can leave an unlimited number of reviews per listing.
- Please note: Normally you'd prohibit reviews until after a booking visit is complete, but in this case for simplicity we allow reviews to be left as soon as a booking's status becomes `accepted`.
- If the user has made more than 1 booking for a given listing, you can use any of their `bookingid`s for the purpose of leaving a review. Just as long as the booking has status `accepted`.

#### 2.4.4 Advanced Listing Rating Viewing 🙉🙉🙉

- On hover of star rating a tool tip appears which displays the break down of how many people rated the booking (both in percentage terms and absolute terms) within each star category. (e.g. see Amazon product rating for reference)
- If you click on a particular star rating, another screen should appear (that can be closed) that shows all of the individual reviews left for that rating.

### 2.5. Feature Set 5. Removing a Listing, Managing Booking Requests (9%)

#### 2.5.1. Removing a live listing

- On the hosted listings screen described in `2.2.1`, add the ability to remove a live listing from being visible to other users.
- Once un-published, those who had made bookings for a removed listing will no longer be able to view it on their landing screen (This will also remove all availability for the listed property)

#### 2.5.2. Viewing booking requests and history for a hosted listing

- A unique route must exist for this screen that is parameterised on the listing ID
- This screen should be accessed via a button or link on the hosted listings screen `2.2.1`.
- On this screen, a list of booking requests are provided for the listing they are viewing. For each booking request, the host is able to accept/deny it.
- The screen should also display the following information about a listing:
  - How long has the listing been up online
  - The booking request history for this listing consisting of all booking requests for this listing and their status (accepted/denied)
  - How many days this year has the listing been booked for
  - How much profit has this listing made the owner this year
  - (Note: When counting the days and profits, inlcude all the bookings, past or future, that have been accepted for this year)

### 2.6. Feature Set 6. Advanced Features (7%)

#### 2.6.1 Listing Profits Graph

- On the screen described in 2.2.1, a graph of how much profit the user has made from all their listings for the past month must be displayed. The X axis should be "how many days ago" (0-30), and the Y axis should be the $$ made on that particular day (sum of income from all listings).

#### 2.6.2. Listing Upload 🙉🙉🙉

- For `2.2.1`, when a new listing is created, the user can optionally upload a .json file containing the full data for a listing. The data structure is validated on the frontend before being passed to the backend normally.
- If you implement this feature, you must attach an example .json into your repo in the project folder. This file must have name `2.6.json`. This is so we can actually test that it works while marking.

#### 2.6.3. Live Notifications 🙉🙉🙉

The system must support live, in-app notifications for logged-in users. This should be done with some kind of polling.

_Polling is very inefficient for browsers, but can often be used as it simplifies the technical needs on the server._

- The following events must trigger a notification for either the **Host** or **Guest**:

  - A booking request is made on the host user’s listing (Host)

  - A guest's booking request is accepted or declined (Guest)

- Notifications must be visible through a notifications panel or dropdown accessible from all screens.

- Unread notifications must be visually distinguishable until the user has viewed them.

### 2.7. Linting

- Linting must be run from inside the `frontend` folder by running `npm run lint`.

### 2.8. Testing

As part of this assignment you are required to write some tests for your components (component testing), and for your application as a whole (ui testing).

For **component testing**, you must:

- Write tests for different components (3 if solo, 6 if working in a pair)
- For each of the components, they mustn't have more than 50% similarity (e.g. you can't test a "Card" component and a "BigCard" component, that are virtually the same)
- Ensure your tests have excellent **coverage** (look at all different use cases and edge cases)
- Ensure your tests have excellent **clarity** (well commented and code isn't overly complex)
- Ensure your tests are **designed** well (logical ordering of tests, avoid any tests that aren't necessary or don't add any meaningful value)
- (We encourage you to only use shallow component rendering)

You can use methods discussed in lectures for component testing, or you can use `cypress`.

For **ui testing**, you must:

- Write a test for the "happy path" of an admin that is described as:

1. Registers successfully
2. Creates a new listing successfully
3. Updates the thumbnail and title of the listing successfully
4. Publish a listing successfully
5. Unpublish a listing successfully
6. Make a booking successfully
7. Logs out of the application successfully
8. Logs back into the application successfully

- (If working in a pair) also required to write a test for another path through the program, describing the steps and the rationale behind this choice in `TESTING.md`
- (If working solo) include a short rationale of the testing you have undertaken within `TESTING.md`

#### Advice for Component Testing

- Find a simple primitive component you've written, and if you don't have one, write one. This could include a common button you use, or a popup, or a box, or an input. Often examples of these are just MUI or other library components you might have wrapped slightly and includes some props you've passed in
- Simply write some unit tests that check that for a given prop input, the component behaves in a certain way (e.g. action or visual display), etc etc
- E.G. Creating a `MyButton` that wraps a MUI `Button`.
- E.G. A simple example is the list of bookings. It takes in booking informed we've defined and renders a bunch of MUI ListItems, Checkboxes, TextFields and IconButtons
- Your app is going to be a set of pages, and those pages are made up of primitive components. But if you don't have layers of components between that it means your code is not well modularised. Another example could be if we said to you - no component should be longer than 50 lines of code. You'd probably go refactor to group common sets of primitives together into a new component.

#### Advice for UI Testing

- For cypress, consider adding `cy.wait(1000)` if necessary to add slight pauses in your tests if you find that the page is rendering slower than cypress is trying to test.
- If you're having issues using Cypress on WSL2, try following [this guide](https://shouv.medium.com/how-to-run-cypress-on-wsl2-989b83795fb6).

#### Other advice / help

- You can welcome to use `enzyme` for testing if you prefer - as long as everything works by running `npm run test`.
- One topic that has helped students is [mocking fetch calls with jest](https://medium.com/fernandodof/how-to-mock-fetch-calls-with-jest-a666ae1e7752).
- The tutor will run an empty (reset) backend when running `npm run test` whilst marking.
- Some students will run into `enzyme adapter` compatibility issues. If you run into these issues you can either:
- Use this unofficial React 17 adapter: https://www.npmjs.com/package/@wojtekmaj/enzyme-adapter-react-17; or
- Downgrade react and react-dom to 16, though this could break other things depending on what other dependencies you're using.

#### Running tests

Tests must be run from inside the `frontend` folder by running `npm run test`. Then you might need to press `a` to run all tests.

You are welcome to modify the `npm run test` command by updating the `test` script inside `frontend/package.json`. For example, if you would like to run standard react testing alongside cypress UI tests you can use `react-scripts test —watchAll=false && npm run cypress open` and if you've used cypress for both component and happy path test, then you can replace that line with `cypress open`.

### 2.9. Other notes

- The port you can use to `fetch` data from the backend is defined in `frontend/src/config.json`
- [This article may be useful to some students](https://stackoverflow.com/questions/66284286/react-jest-mock-usenavigate)
- For users of typescript, [follow this guide](https://nw-syd-gitlab.cseunsw.tech/COMP6080/25T3/react-typescript)
- For images, you can just pass in base64 encoded images
- For certain requests you may want to "poll" the backend, i.e. have the friend end repeatedly make an API call every 1 second to check for updates.
- For deployment help & instructions, refer to `deployment.md`
