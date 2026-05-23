# Requirements Document

## 1. Application Overview

**Application Name**: Stay Jazzy Multimedia Website

**Application Description**: A comprehensive multimedia company website for Stay Jazzy Multimedia, established in 2012. The platform showcases company services, portfolio works, enables service booking with multi-stage tracking, provides live chat support between clients and admin, and includes a full-featured admin dashboard for content and booking management.

**Brand Information**:
- Company Name: Stay Jazzy Multimedia
- Logo URL: https://miaoda-conversation-file.s3cdn.medo.dev/user-bo1v51m4ml1c/app-bu4kziuqa9dt/20260523/logo.jpeg
- Brand Color: Dark green (#1a6b3a)
- Core Values: Customer-focused, People-centered, Teamwork, Performance-driven, Leadership, Results-oriented, Tenacious, Maverick, Professionals, Ethical
- Vision: To become a world-class business brand and development consortium

## 2. Users and Usage Scenarios

**Target Users**:
- Potential clients seeking multimedia services (events, photography, videography, web development, etc.)
- Existing clients checking booking status and communicating with admin
- Company administrators managing bookings, content, and client communications

**Core Usage Scenarios**:
- Clients browse services and portfolio, book appointments for multimedia services
- Clients track booking progress through multi-stage system and communicate via live chat
- Administrators access admin portal directly via /admin route, manage all bookings, update website content, respond to inquiries, and track user activity

## 3. Page Structure and Functionality

### 3.1 Page Hierarchy

```
Public Website
├── Home Page
├── Who We Are Page
├── Offers Page
├── Works Page
├── Contact Us Page
├── Check Booking Page
├── Terms and Conditions Page
├── Privacy Policy Page
└── FAQs Page

Booking Portal (authenticated users only)
└── Booking Dashboard

Admin Portal (accessible only via /admin route)
└── Admin Dashboard
    ├── Overview/Analytics
    ├── Bookings Management
    ├── Services Management
    ├── Content Management
    ├── Contact Messages
    ├── Client Logos Management
    ├── Newsletter Subscribers
    └── User Activity Tracking
```

### 3.2 Public Website Pages

#### 3.2.1 Home Page

**Navigation Bar**:
- Transparent overlay on hero slider, becomes solid on scroll
- Logo on left side
- Menu items: Home, Who We Are, Offers, Works, Contact Us, Check Booking
- Prominent \"Book Appointment\" button (visible on both desktop and mobile)
- No admin link or reference

**Social Media Icons**:
- Fixed vertically on left side of viewport
- Icons for Instagram, Facebook, TikTok
- Visible above all slider content

**Hero Slider Section**:
- Full-viewport slider covering entire first page
- Navigation bar overlaid on top
- Down-arrow indicator at bottom center for scrolling to next section
- Admin can manage slider images and text

**About Company Section**:
- Company description and introduction
- Standard layout without parallax effect

**Why Choose Us Section**:
- Highlights company strengths and differentiators
- Parallax effect transition

**Services/Offers Preview Section**:
- Brief overview of service categories
- Link to full Offers page
- Parallax effect transition

**Works/Portfolio Preview Section**:
- Showcase selected portfolio items
- Link to full Works page
- Parallax effect transition

**Client Logos Marquee**:
- Horizontal scrolling marquee with client logos
- Logos transition from black & white to colored when in view
- Slow left-to-right motion

**Footer** (appears on all pages):
- Top section with 4 columns:
  - Column 1: Logo and company description
  - Column 2: Page navigation links (Home, Who We Are, Offers, Works, Contact Us, Check Booking, FAQs)
  - Column 3: Contact details (address, phone, email, social media)
  - Column 4: Newsletter signup form and social media icons
- Bottom section: Copyright text, links to Terms and Conditions, Privacy Policy
- No admin link or reference anywhere in footer

#### 3.2.2 Who We Are Page

**Company Information**:
- Detailed about section
- Mission statement
- Vision statement
- Core values list

**Team Section**:
- Display team members with photos, names, roles, and bios
- Admin can add/edit/remove team members

**Client Logos Marquee** (above footer)

**Footer**

#### 3.2.3 Offers Page

**Service Packages Display**:
- Tab view organization of service packages
- Initial packages include:
  - Events: Weddings, Funerals, Birthdays, End of Year, Corporate, Church, Custom
  - Extra Services: Stage Lighting, LED Screens and Trusses, Photography, Videography, 4K and 8K Livestreaming, Drone Piloting, Website Development, Mobile App Development, Database Management, System Integrations

**Sub-Services and Pricing Tiers**:
- Each sub-service displays three pricing tiers: Gold, Diamond, Platinum
- Each tier shows:
  - Price and currency
  - List of included items (green checkmark)
  - List of excluded items (red or grey X)
  - Description
- Example: Events → Weddings → Gold Wedding | Diamond Wedding | Platinum Wedding

**Book Appointment Button**:
- Available on each package/sub-service
- Initiates booking flow

**Client Logos Marquee** (above footer)

**Footer**

#### 3.2.4 Works Page

**Portfolio Gallery**:
- Display past work items with images, titles, and descriptions
- Filterable by category
- Admin can add/edit/remove portfolio items

**Client Logos Marquee** (above footer)

**Footer**

#### 3.2.5 Contact Us Page

**Contact Form**:
- Fields: Name, Email, Phone, Subject, Message
- Submit button sends message to backend API

**Company Contact Details**:
- Address
- Phone number
- Email address
- Map or location information

**Client Logos Marquee** (above footer)

**Footer**

#### 3.2.6 Check Booking Page

**Booking Lookup**:
- Input field for email or phone number
- Submit button to check booking status

**Lookup Results**:
- If booking found and active: Send OTP to phone number, verify, redirect to booking dashboard
- If booking closed/cancelled: Display message informing user
- If no booking found: Redirect to Offers page

**Client Logos Marquee** (above footer)

**Footer**

#### 3.2.7 Terms and Conditions Page

**Content Display**:
- Full terms and conditions text
- Admin can edit content

**Client Logos Marquee** (above footer)

**Footer**

#### 3.2.8 Privacy Policy Page

**Content Display**:
- Full privacy policy text
- Admin can edit content

**Client Logos Marquee** (above footer)

**Footer**

#### 3.2.9 FAQs Page

**FAQ List**:
- Display questions and answers
- Admin can add/edit/remove FAQs
- Display order controlled by admin

**Client Logos Marquee** (above footer)

**Footer**

### 3.3 Booking System

#### 3.3.1 Booking Flow

**Step 1: Service Selection**:
- User selects one or multiple sub-services from Offers page
- User clicks \"Book Appointment\" button (on navbar or within service card)

**Step 2: User Information Entry**:
- User enters email and phone number

**Step 3: Account Check**:
- Backend API checks if email and phone combination exists in Neon database
- If exists: Generate and send OTP to phone number
- If not exists: Create new booking record in database, generate and send OTP to phone number

**Step 4: OTP Verification**:
- User receives OTP via SMS or email
- User enters OTP for verification
- Backend API validates OTP
- Upon successful verification, redirect to booking dashboard

#### 3.3.2 Booking Dashboard (User-Facing)

**Access Control**:
- Only accessible after completing booking flow or through Check Booking page with OTP verification
- Users cannot access without active booking

**Booking Status Display**:
- Multi-stage progress indicator showing:
  - Initial Payment
  - In Progress
  - Review
  - Final Stage
  - Completed
- Current stage highlighted
- Stage notes and updates visible

**Booking Details**:
- Selected services list
- Pricing information
- Booking dates
- Contact information

**Live Chat**:
- Real-time messaging with admin
- Message history display
- Send text messages

**Cancel Booking**:
- Button to cancel booking
- Confirmation prompt before cancellation
- Upon cancellation: Booking status changes to cancelled, live chat closes

### 3.4 Admin Portal

#### 3.4.1 Admin Access

**Admin Route**:
- Admin portal is ONLY accessible by directly visiting /admin in the browser
- No links, buttons, or references to admin exist anywhere on the public website
- Visiting /admin displays admin login page

**Admin Login Page** (/admin):
- Email input field
- Password input field
- Login button
- Backend API validates credentials against Neon database
- Upon successful login, backend issues JWT token
- JWT token stored and used for subsequent admin API requests

#### 3.4.2 Admin Dashboard

**3.4.2.1 Overview/Analytics**:
- User activity statistics
- Booking statistics (total, active, completed, cancelled)
- Revenue overview
- Page view analytics

**3.4.2.2 Bookings Management**:
- View all bookings in table format
- Filter by status (all, active, completed, cancelled)
- Search by user email or phone
- Click booking to view details
- Update booking stage and add notes
- Initiate/manage live chat with user
- View booking history and timeline

**3.4.2.3 Services Management**:
- View all service packages
- Add new service package (name, description, display order)
- Edit existing package
- Delete package
- Activate/deactivate package
- Manage sub-services within each package:
  - Add sub-service (name, description, display order)
  - Edit sub-service
  - Delete sub-service
  - Activate/deactivate sub-service
- Manage pricing tiers for each sub-service:
  - Add tier (Gold/Diamond/Platinum, price, currency, description)
  - Edit tier
  - Delete tier
  - Add included features (feature text, checkmark)
  - Add excluded features (feature text, X mark)
  - Edit/delete features

**3.4.2.4 Content Management**:
- Hero Slides:
  - Add new slide (title, subtitle, image upload)
  - Edit existing slide
  - Delete slide
  - Reorder slides (display order)
  - Activate/deactivate slide
- About Company:
  - Edit company description
  - Edit mission statement
  - Edit vision statement
  - Edit core values
- Why Choose Us:
  - Edit section content
- Team Members:
  - Add team member (name, role, bio, image upload)
  - Edit team member
  - Delete team member
  - Reorder team members
- Portfolio/Works:
  - Add work item (title, category, description, image upload)
  - Edit work item
  - Delete work item
  - Reorder work items
  - Activate/deactivate work item
- Static Pages:
  - Edit Terms and Conditions content
  - Edit Privacy Policy content
- FAQs:
  - Add FAQ (question, answer, display order)
  - Edit FAQ
  - Delete FAQ
  - Reorder FAQs
  - Activate/deactivate FAQ

**3.4.2.5 Contact Messages**:
- View all contact form submissions
- Filter by status (new, responded)
- Mark as read/unread
- Add admin response
- Delete message

**3.4.2.6 Client Logos Management**:
- View all client logos
- Add new client logo:
  - Client name
  - Upload black & white version
  - Upload colored version
  - Display order
- Edit client logo
- Delete client logo
- Reorder logos
- Activate/deactivate logo

**3.4.2.7 Newsletter Subscribers**:
- View all newsletter subscribers
- Export subscriber list
- View subscription date

**3.4.2.8 User Activity Tracking**:
- View page visits by page path
- View user identifiers
- View visit timestamps
- Filter by date range

### 3.5 Image Upload Functionality

**Upload Process**:
- Admin selects image file from device
- Frontend sends image to backend API
- Backend displays upload progress
- Backend auto-compresses images over 1MB to WEBP format
- Backend stores image and returns URL
- Uploaded image URL stored in Neon database

**Applicable Sections**:
- Hero slides
- Team members
- Portfolio works
- Client logos (both B&W and colored versions)

### 3.6 Payment Integration

**Payment Processing**:
- Use Paystack InlineJS for all payments
- Integrate Paystack payment flow into booking process
- Handle payment callbacks and update booking status accordingly

## 4. Business Rules and Logic

### 4.1 Database and Backend

**Database**:
- Use Neon PostgreSQL database
- Database URL provided as environment variable (DATABASE_URL)
- Backend connects to Neon using pg or postgres library

**Backend API**:
- Backend handles all database operations
- Frontend calls backend API endpoints for data retrieval and manipulation
- API endpoints include:
  - Public endpoints: services, portfolio, FAQs, contact form submission, newsletter signup, booking creation, OTP verification
  - Admin endpoints (require JWT authentication): bookings management, services management, content management, messages, logos, subscribers, activity tracking

### 4.2 Authentication

**Admin Authentication**:
- Admin logs in with email and password
- Backend validates credentials against Neon database
- Upon successful login, backend issues JWT token
- JWT token included in subsequent admin API requests
- JWT token expires after set period

**Booking User Authentication**:
- User enters email and phone number during booking flow
- Backend generates OTP and sends to phone number (via SMS or email)
- User enters OTP for verification
- Backend validates OTP
- Upon successful verification, user gains access to booking dashboard
- OTP expires after set time period

### 4.3 Admin Route Access

**Admin Portal Visibility**:
- Admin portal is ONLY accessible by directly typing /admin in browser address bar
- No links, buttons, menu items, or any references to admin exist on public website
- Footer, navigation bar, and all public pages contain no admin access points

### 4.4 Booking System Rules

**Booking Creation**:
- User must select at least one sub-service to initiate booking
- Email and phone combination uniquely identifies a user
- If email+phone exists: User accesses existing booking
- If email+phone does not exist: New booking record created in Neon database

**OTP Verification**:
- OTP sent to phone number provided by user
- OTP must be verified before accessing booking dashboard
- OTP expires after a set time period

**Booking Access**:
- Users can only access booking dashboard through:
  - Completing booking flow from Offers page
  - Using Check Booking page with valid email/phone and OTP verification
- No direct URL access without authentication

**Booking Stages**:
- Booking progresses through stages: Initial Payment → In Progress → Review → Final Stage → Completed
- Admin updates stage status and adds notes
- User views current stage and history

**Booking Cancellation**:
- User can cancel booking from booking dashboard
- Upon cancellation:
  - Booking status changes to \"Cancelled\"
  - Live chat closes
  - User cannot access booking dashboard for this booking
  - User must create new booking to access portal again

**Live Chat**:
- Available only for active bookings
- Closes when booking is cancelled or completed
- Admin can initiate chat from bookings management
- User can send messages from booking dashboard

### 4.5 Service Package and Pricing Structure

**Package Hierarchy**:
- Service Package (e.g., Events, Extra Services)
  - Sub-Service (e.g., Weddings, Photography)
    - Pricing Tier (Gold, Diamond, Platinum)
      - Included Features (list)
      - Excluded Features (list)

**Pricing Tier Display**:
- Each tier shows price, currency, description
- Included features marked with green checkmark
- Excluded features marked with red or grey X

### 4.6 Client Logos Marquee

**Logo Display**:
- Logos scroll horizontally from right to left
- Slow, continuous motion
- When logo enters viewport: Transitions from black & white to colored version
- When logo exits viewport: Reverts to black & white (or remains colored based on design choice)

**Logo Management**:
- Admin uploads two versions per client: B&W and colored
- Display order controlled by admin
- Only active logos appear in marquee

### 4.7 Newsletter Signup

**Signup Process**:
- User enters email in footer newsletter form
- Frontend sends request to backend API
- Backend validates email format
- Backend checks if email already subscribed in Neon database
- If new: Add to subscriber list, display success message
- If existing: Display message indicating already subscribed

### 4.8 Contact Form Submission

**Submission Process**:
- User fills out contact form (name, email, phone, subject, message)
- Frontend validates required fields
- Frontend sends data to backend API
- Backend stores message in Neon database
- Backend sends notification to admin
- User sees confirmation message

### 4.9 Portfolio Filtering

**Filter Functionality**:
- Works page displays category filter options
- User selects category
- Frontend displays only works matching selected category
- User can select \"All\" to view all works

### 4.10 Page View Tracking

**Tracking Logic**:
- Frontend records page path when user visits a page
- Frontend sends tracking data to backend API
- Backend records user identifier (if available) or anonymous identifier
- Backend records timestamp in Neon database
- Admin views aggregated data in User Activity Tracking section

## 5. Exception and Boundary Cases

| Scenario | Handling |
|----------|----------|
| User enters invalid email format | Display error message, prevent form submission |
| User enters invalid phone format | Display error message, prevent form submission |
| OTP verification fails | Display error message, allow user to request new OTP |
| OTP expires | Display message, allow user to request new OTP |
| User tries to access booking dashboard without authentication | Redirect to Check Booking page |
| User tries to access cancelled booking | Display message: \"Booking is closed/cancelled\", redirect to Offers page |
| Admin tries to delete service package with active bookings | Display warning, require confirmation or prevent deletion |
| Image upload fails | Display error message, allow retry |
| Image file size exceeds limit | Auto-compress to WEBP format, proceed with upload |
| User submits contact form with missing required fields | Display error message indicating missing fields |
| Admin login with incorrect credentials | Display error message, allow retry |
| User tries to cancel already completed booking | Disable cancel button or display message |
| Network error during live chat | Display connection error, attempt to reconnect |
| User selects no services before clicking Book Appointment | Display message: \"Please select at least one service\" |
| Admin tries to reorder items with same display order | Backend auto-adjusts display order to maintain sequence |
| Newsletter signup with already subscribed email | Display message: \"Email already subscribed\" |
| Portfolio filter with no matching works | Display message: \"No works found in this category\" |
| User tries to access /admin without credentials | Display admin login page |
| JWT token expires during admin session | Redirect to admin login page, display session expired message |
| Backend API connection to Neon database fails | Display error message, log error for debugging |
| Payment processing via Paystack fails | Display error message, allow user to retry payment |

## 6. Acceptance Criteria

1. User visits Home page, views hero slider and company information, scrolls through sections with parallax effects, sees client logos marquee above footer, confirms no admin link exists anywhere on public website
2. User navigates to Offers page, browses service packages in tab view, views Gold/Diamond/Platinum pricing tiers with included/excluded features for a sub-service
3. User clicks \"Book Appointment\" on a sub-service, enters email and phone number, receives OTP via SMS or email, verifies OTP, and is redirected to booking dashboard
4. User views booking status stages on booking dashboard, sends a message via live chat to admin, and receives a response
5. Admin directly types /admin in browser, sees admin login page, logs in with email and password, receives JWT token, and accesses admin dashboard
6. Admin navigates to Bookings Management, views booking list, updates a booking stage with notes, responds to user via live chat
7. Admin navigates to Services Management, adds a new sub-service under an existing package, creates Gold/Diamond/Platinum tiers with pricing and features, data is stored in Neon database
8. Admin navigates to Content Management, uploads a new hero slide image (auto-compressed to WEBP if over 1MB), edits About Company text, adds a new team member with photo, all changes saved to Neon database
9. User visits Works page, filters portfolio by category, views filtered results
10. User submits contact form on Contact Us page, backend API stores message in Neon database, admin receives notification and views message in Contact Messages section
11. User enters email in newsletter signup form in footer, backend API validates and stores in Neon database, admin views subscriber in Newsletter Subscribers section
12. User initiates payment via Paystack InlineJS during booking flow, payment is processed, booking status is updated accordingly

## 7. Out of Scope for This Release

- Multi-language support beyond English
- Advanced analytics and reporting dashboards
- Email marketing automation and campaign management
- Customer review and rating system
- Integration with third-party CRM systems
- Mobile native applications (iOS/Android)
- Advanced SEO tools and optimization features
- Social media auto-posting and scheduling
- Video hosting and streaming capabilities
- Advanced user roles and permissions beyond admin/user
- Automated booking reminders and follow-ups
- Invoice generation and financial reporting
- Integration with accounting software
- Multi-currency support
- Geolocation-based service recommendations
- AI-powered chatbot for customer support
- Advanced image editing tools within admin panel
- Bulk import/export of services and bookings
- API for third-party integrations