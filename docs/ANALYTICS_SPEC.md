**HUMBLE HALAL NEWSLETTER**

Custom Analytics & Tracking Specification

Independent Analytics Dashboard + Claude Code Build Prompts

March 2026 \| Robert @ ONNIFY WORKS

1\. Overview & Strategy

This spec defines a custom analytics tracking system for the Humble
Halal Newsletter and any associated directory/listing components.
Inspired by the plasma directory case study, the goal is to build a
self-contained tracking layer independent of GA4 that captures
high-intent user actions, proves lead value to potential sponsors, and
provides the data backbone for monetization pitches.

The system tracks three core dimensions: engagement actions (what users
do), demand signals (what users search for), and journey flows (how
users navigate). Together these let you quantify lead value, identify
top-performing content categories, and build a compelling sponsorship
deck with real data.

2\. Lead Action Definitions

Lead actions are the high-intent behaviors that indicate a user is ready
to transact. These are the actions you will track and use to calculate
lead value for sponsors.

2.1 Primary Lead Actions (High Intent)

  ------------------ ---------------------------- -------------------------
  **Action**         **Description**              **Value Signal**

  click_website      User clicks through to a     Direct referral traffic
                     listed business website      to sponsor

  click_directions   User taps for Google Maps    Physical visit intent
                     directions to a business     

  click_phone        User taps to call a listed   Highest intent --- ready
                     business                     to act

  click_booking      User clicks a                Transaction intent
                     reservation/booking link     
                     (Chope, Google Reserve)      

  click_menu         User clicks to view a        Pre-visit research intent
                     restaurant menu              

  click_affiliate    User clicks an affiliate     Purchase consideration
                     product link (Islamic        
                     finance, travel)             
  ------------------ ---------------------------- -------------------------

2.2 Secondary Engagement Actions

  ------------------ ---------------------------- -------------------------
  **Action**         **Description**              **Use Case**

  search_query       User searches for a term in  Demand intelligence
                     site search                  

  browse_category    User browses a category      Category demand mapping
                     (e.g., Halal Korean, Jurong) 

  view_listing       User views a business        Impression tracking for
                     listing page                 sponsors

  save_listing       User saves/bookmarks a       High engagement signal
                     listing                      

  submit_review      User submits a review or     Community contribution
                     price report                 

  share_listing      User shares a listing via    Organic amplification
                     social or messaging          

  newsletter_click   User clicks from Beehiiv     Email-to-site attribution
                     email to site                

  set_notification   User opts into listing/price Retention and return
                     alerts                       visit signal
  ------------------ ---------------------------- -------------------------

3\. Tracking Events Schema

Every trackable action gets stored as an event with a consistent schema.
This makes it easy to query, aggregate, and display in your dashboard.

3.1 Event Object Structure

{

\"event_id\": \"uuid-v4\",

\"event_type\": \"click_website \| click_directions \| search_query \|
\...\",

\"timestamp\": \"2026-03-07T14:23:00Z\",

\"session_id\": \"anonymous-session-hash\",

\"page_url\": \"/listings/singapore/jurong/halal-korean-bbq\",

\"referrer\": \"beehiiv \| reddit \| google \| direct\",

\"listing_id\": \"listing-uuid (if applicable)\",

\"listing_name\": \"Halal Korean BBQ\",

\"listing_category\": \"Korean \| Buffet \| Cafe \| \...\",

\"listing_area\": \"Jurong \| Tampines \| Bugis \| \...\",

\"brand_name\": \"Restaurant chain name (if applicable)\",

\"search_term\": \"user search query (if search event)\",

\"source_channel\": \"newsletter \| directory \| article\",

\"device_type\": \"mobile \| desktop\",

\"user_agent\": \"browser string\"

}

3.2 Attribution Tagging

Use UTM parameters on all Beehiiv newsletter links to track
email-to-site attribution. This is critical for proving newsletter value
to sponsors.

// Newsletter link format:

https://humblehalal.sg/listings/jurong/halal-korean-bbq

?utm_source=beehiiv

&utm_medium=email

&utm_campaign=weekly-2026-03-07

&utm_content=featured-restaurant

4\. Dashboard Components

The analytics dashboard is your internal command center and your sales
tool. Build it as an admin-only page in your Next.js app (or
standalone). Here are the panels to build:

4.1 Daily Overview Panel

  ------------------ --------------------------- -------------------------
  **Metric**         **Definition**              **Why It Matters**

  Total Lead Actions Sum of all primary lead     Core KPI for monetization
                     actions today               pitches

  Unique Users with  Distinct sessions with 1+   Proves real human intent,
  Lead Actions       lead action                 not bots

  Top Performing     Listing with most lead      Identify your most
  Listing            actions today               valuable inventory

  Search Volume      Total searches performed    Demand signal --- what
                     today                       users want

  Newsletter         Clicks from Beehiiv to site Email channel attribution
  Click-throughs     today                       

  Conversion Rate    Lead actions / total page   Efficiency metric for
                     views                       sponsors
  ------------------ --------------------------- -------------------------

4.2 Demand Intelligence Panel

This is where you identify what your audience actually wants. Track and
rank:

-   Top Search Queries: What terms people search for most (e.g., \"halal
    buffet\", \"Muslim-friendly cafe Orchard\")

-   Top Categories by Demand: Which cuisine types or service categories
    get the most browsing/searching

-   Top Areas by Demand: Which Singapore neighborhoods generate the most
    activity

-   Unmatched Searches: Searches that return zero results --- these are
    content gaps and listing opportunities

The unmatched searches panel is especially powerful. If 50 people search
for \"halal Japanese Tampines\" and you have no listings, that tells you
exactly what content to create and which restaurants to approach for
featured listings.

4.3 Top Areas Chart

Equivalent to the plasma directory \"Top Cities by Demand\" chart. Rank
Singapore neighborhoods by total lead actions, searches, and listing
views. This tells you where to focus cold outreach.

  ------------- ------------ -------------- -------------- ------------------
  **Area**      **Lead       **Searches**   **Listings     **Priority**
                Actions**                   Viewed**       

  Tampines      24           45             120            High

  Jurong East   18           38             95             High

  Bugis / Arab  15           32             88             Medium
  Street                                                   

  Woodlands     12           28             72             Medium

  Orchard       9            22             65             Low (tourist)
  ------------- ------------ -------------- -------------- ------------------

(Sample data for illustration. Your dashboard generates this
dynamically.)

4.4 Live Activity Feed

Real-time feed showing visitor journeys and actions. Each entry shows:

-   Entry point: How they arrived (newsletter click, search, direct,
    Reddit)

-   Browse path: Pages visited in sequence

-   Lead action taken: What high-intent action they performed

-   Listing involved: Which business benefited

This is the panel you screenshot and include in sponsorship pitch decks.
Seeing real visitor journeys is incredibly persuasive.

4.5 Brand / Sponsor Deep Dive

Once you have sponsors or featured listings, create per-brand analytics
views showing:

-   Total impressions (listing views) for their listings

-   Total lead actions attributed to their listings

-   Click-through rate from listing view to lead action

-   Comparison to category average (\"Your listing gets 2.3x more clicks
    than average\")

-   Traffic sources driving visitors to their listing

Offer this as a monthly sponsor report. It prevents churn because
sponsors can see exactly what they are getting for their money.

4.6 Journey Explorer

Track the full navigation path of each session. Clickable entries show:

-   Source: Newsletter, Google, Reddit, direct

-   Pages viewed: Full sequence of pages visited

-   Search terms used: If they searched, what for

-   Final action: The lead action that ended their session

-   Listing destination: Which business they engaged with

5\. Monetization Math Framework

Use this framework to calculate and present lead value to potential
sponsors. The same napkin math from the plasma case study, adapted for
Singapore halal F&B.

5.1 Lead Value Calculation

Daily Lead Value = Daily Unique Lead Actions x Estimated CPC

Singapore F&B benchmarks:

Google Ads CPC for \"halal restaurant singapore\": SGD \$1.50 - \$4.00

Google Ads CPC for \"halal buffet near me\": SGD \$2.00 - \$5.00

Chope/Burpple featured listing: SGD \$200 - \$800/month

Conservative example:

40 daily lead actions x SGD \$2.50 CPC = SGD \$100/day

SGD \$100 x 30 days = SGD \$3,000/month total lead value

Your pitch: \"We are generating \~SGD \$3,000/month in lead value

across all halal listings. A featured listing for your

restaurant starts at SGD \$150/month.\"

5.2 Pricing Tiers

  --------------- --------------- ----------------------------------------
  **Tier**        **Monthly       **Includes**
                  Price**         

  Basic Featured  SGD \$100-150   Priority placement in search results +
                                  category pages, listing badge

  Premium         SGD \$250-400   Basic + newsletter mention (1x/month) +
  Featured                        monthly analytics report

  Exclusive       SGD \$500-800   Premium + dedicated newsletter feature +
  Sponsor                         social media post + top banner in
                                  category
  --------------- --------------- ----------------------------------------

Price per location. Multi-location discounts for chains (e.g., 3 outlets
= 20% off total).

5.3 Long-Tail Monetization

-   Affiliate revenue: Islamic finance products, halal travel booking,
    modest fashion brands

-   Data products: Aggregated halal dining trends sold to F&B
    consultancies or chains expanding into Singapore

-   Newsletter sponsorships: Separate from directory featured listings
    --- Beehiiv ad slots for halal brands

-   Premium community: Paid tier for exclusive deals, early access to
    restaurant reviews

6\. Claude Code Build Prompts

Copy these prompts directly into Claude Code to build each component.
Adapt the tech stack references to whatever you are building on
(Next.js, Astro, etc.).

6.1 Core Event Tracker

PROMPT: \"Build a lightweight custom analytics event tracker for my

Humble Halal directory. It should NOT use Google Analytics.

Requirements:

\- Server-side API endpoint: POST /api/track that accepts event objects

\- Event schema: event_type, timestamp, session_id (anonymous hash),

page_url, referrer, listing_id, listing_name, listing_category,

listing_area, brand_name, search_term, source_channel, device_type

\- Store events in a database table called \'analytics_events\'

\- Client-side helper function trackEvent(type, metadata) that fires

on user actions

\- Auto-track page views on every route change

\- Parse UTM parameters from URL and include in events

\- Generate anonymous session IDs using a cookie (no PII)

\- Rate limit to prevent spam: max 100 events per session per hour\"

6.2 Lead Action Hooks

PROMPT: \"Add lead action tracking to all interactive elements in my

Humble Halal directory listings. For every listing, track these

click events:

\- click_website: when user clicks the business website link

\- click_directions: when user clicks Google Maps directions

\- click_phone: when user taps the phone number

\- click_booking: when user clicks a reservation link

\- click_menu: when user clicks to view a menu

Each event should capture the listing_id, listing_name,

listing_category, listing_area, and brand_name.

Also track search behavior:

\- search_query: when user submits a search, capture the search_term

\- browse_category: when user clicks into a category or area filter

\- view_listing: when a listing detail page loads

Track whether the user arrived via search bar vs browse navigation

so I can see which discovery method converts better.\"

6.3 Analytics Dashboard

PROMPT: \"Build an admin-only analytics dashboard at /admin/analytics

for my Humble Halal directory. This dashboard should query the

analytics_events table and display:

1\. DAILY OVERVIEW: total lead actions, unique users with lead

actions, top performing listing, total searches, newsletter

click-throughs, conversion rate (lead actions / page views)

2\. DEMAND INTELLIGENCE: top search queries ranked by frequency,

top categories by browsing + searching, top Singapore areas

by activity, and an \'unmatched searches\' panel showing

searches with zero results

3\. TOP AREAS CHART: bar chart ranking Singapore neighborhoods

by lead actions, searches, and listing views

4\. LIVE ACTIVITY FEED: real-time feed showing the last 50

visitor journeys with entry point, pages visited, and

lead action taken

5\. BRAND DEEP DIVE: select a brand/restaurant and see their

total impressions, lead actions, CTR, and traffic sources

6\. JOURNEY EXPLORER: click any session to see the full

navigation path from entry to lead action

Add date range filters (today, 7 days, 30 days, custom).

Add export to CSV for any panel.\"

6.4 Sponsor Report Generator

PROMPT: \"Create a sponsor report generator at /admin/reports that

lets me select a brand or listing and generate a PDF report

showing their analytics for a given time period. Include:

\- Total impressions (listing page views)

\- Total lead actions (clicks to website, directions, phone)

\- Click-through rate vs category average

\- Top traffic sources driving visitors to their listing

\- Sample visitor journeys (anonymized)

\- Chart showing daily lead actions over time

This report should be styled with the Humble Halal brand and

be ready to email to sponsors as proof of ROI. Include a

summary line like: We drove X leads to your business this month.\"

6.5 Newsletter Attribution Tracker

PROMPT: \"Add newsletter attribution tracking to my analytics.

When a user arrives from a Beehiiv newsletter link with UTM

parameters (utm_source=beehiiv), track their entire session

separately so I can report on newsletter-driven activity.

Create a \'Newsletter Performance\' panel in the dashboard

showing:

\- Total click-throughs from newsletter this week/month

\- Which newsletter editions drive the most traffic

\- Which listings newsletter readers engage with most

\- Conversion rate: newsletter visitors who take a lead action

\- Top content types that drive newsletter-to-site traffic

This data proves to sponsors that a newsletter mention drives

real measurable traffic to their business.\"

7\. Implementation Roadmap

Phase 1: Foundation (Week 1-2)

1.  Deploy core event tracker API endpoint and client-side helper

2.  Add page view auto-tracking on all routes

3.  Implement lead action hooks on all listing interactive elements

4.  Set up UTM parsing for newsletter attribution

5.  Build basic daily overview dashboard panel

Phase 2: Intelligence (Week 3-4)

1.  Build demand intelligence panel (top searches, categories, areas)

2.  Build live activity feed and journey explorer

3.  Add unmatched searches tracking

4.  Create top areas chart visualization

Phase 3: Monetization Tools (Week 5-6)

1.  Build brand deep dive panel

2.  Create sponsor report PDF generator

3.  Build newsletter performance panel

4.  Create featured listing placement system

5.  Prepare sponsorship pitch deck with real data

Phase 4: Outreach (Week 7+)

1.  Identify top 10 areas by demand from dashboard data

2.  Cold approach halal restaurants in high-demand areas with data proof

3.  Offer 1-month free featured listing trial with analytics report

4.  Convert trials to paid featured listings using sponsor report data

8\. Reddit Launch Playbook

Adapted from the plasma directory strategy. Post in relevant subreddits
with a value-first angle to drive initial traffic, crowdsource content,
and surface bugs.

8.1 Target Subreddits

-   r/singapore --- General audience, frame as \"built a tool to help
    find halal food\"

-   r/SingaporeEats --- Food focused, share as a community resource

-   r/halal --- Global halal community, position as Singapore-focused
    resource

-   r/digitalnomad or r/travel --- For Muslim-friendly travel content
    angle

-   Facebook Groups: Singapore Halal Food, Halal Food Hunt SG, Muslim
    Mummies SG

8.2 Post Framework

Title: \"I built a free directory to help find halal restaurants in
Singapore with real community reviews and pricing\"

Body: Lead with the problem (hard to find reliable halal info in one
place), explain what you built, ask for feedback and contributions
(reviews, hidden gems), and invite people to submit their favourite
spots. Always value-first, never promotional.

*End of specification. All prompts are ready to paste into Claude Code.
Adjust tech stack references as needed for your Humble Halal
implementation.*
