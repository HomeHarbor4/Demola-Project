import { sql } from 'drizzle-orm';
import { db } from './db';
import { users, properties, locations, neighborhoods, posts, messages, footerContents, settings, staticPages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
  console.log('Starting comprehensive database seeding...');

  // --- 1. USERS ---
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const demouserPasswordHash = await bcrypt.hash('password123', 10);
  const agentPasswordHash = await bcrypt.hash('agent123', 10);

  console.log('Deleting old data...');
  await db.delete(messages);
  await db.delete(properties);
  await db.delete(locations);
  await db.delete(neighborhoods);
  await db.delete(posts);
  await db.delete(footerContents);
  await db.delete(settings);
  await db.delete(users);
  console.log('Old data deleted.');

  // Insert users
  console.log('Seeding users...');
  const userSeeds = [
    {
      username: 'admin',
      hashedPassword: adminPasswordHash,
      email: 'admin@homeharbor.com',
      name: 'Admin User',
      role: 'admin',
      photoURL: 'https://randomuser.me/api/portraits/men/1.jpg',
      createdAt: new Date(),
    },
    {
      username: 'demouser',
      hashedPassword: demouserPasswordHash,
      email: 'demouser@homeharbor.com',
      name: 'Demo User',
      role: 'user',
      photoURL: 'https://randomuser.me/api/portraits/women/2.jpg',
      createdAt: new Date(),
    },
    {
      username: 'agent',
      hashedPassword: agentPasswordHash,
      email: 'agent@homeharbor.com',
      name: 'Agent User',
      role: 'agent',
      photoURL: 'https://randomuser.me/api/portraits/men/3.jpg',
      createdAt: new Date(),
    }
  ];
  userSeeds.forEach((u, i) => console.log(`User seed [${i}]:`, u));
  const [adminUser] = await db.insert(users).values(userSeeds[0]).returning();
  const [agentUser] = await db.insert(users).values(userSeeds[1]).returning();
  const [regularUser] = await db.insert(users).values(userSeeds[2]).returning();
  console.log('Users seeded.');

  // --- 2. LOCATIONS ---
  console.log('Seeding locations...');
  const locationsSeed = [
    {
      name: 'Helsinki', city: 'Helsinki', country: 'Finland',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
      propertyCount: 0, latitude: 60.1699, longitude: 24.9384,
      description: 'Capital of Finland, vibrant and modern.', active: true,
      municipalityCode: '091'
    },
    {
      name: 'Oulu', city: 'Oulu', country: 'Finland',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      propertyCount: 0, latitude: 65.0121, longitude: 25.4651,
      description: 'Northern city known for tech and education.', active: true,
      municipalityCode: '564'
    },
    {
      name: 'Stockholm', city: 'Stockholm', country: 'Sweden',
      image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
      propertyCount: 0, latitude: 59.3293, longitude: 18.0686,
      description: "Sweden's capital, built on 14 islands.", active: true,
      municipalityCode: null
    },
    {
      name: 'Gothenburg', city: 'Gothenburg', country: 'Sweden',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
      propertyCount: 0, latitude: 57.7089, longitude: 11.9746,
      description: 'Major port city on Sweden\'s west coast.', active: true,
      municipalityCode: null
    }
  ];
  locationsSeed.forEach((loc, i) => console.log(`Location seed [${i}]:`, loc));
  const insertedLocations = await db.insert(locations).values(locationsSeed).returning();
  console.log('Locations seeded.');

  // --- 3. NEIGHBORHOODS ---
  console.log('Seeding neighborhoods...');
  const neighborhoodsSeed = [
    {
      name: 'Punavuori', city: 'Helsinki',
      description: 'Trendy, bohemian neighborhood in Helsinki.',
      image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
      averagePrice: '480000', populationDensity: 9000, walkScore: 97, transitScore: 94,
      latitude: '60.1602', longitude: '24.9395', active: true
    },
    {
      name: 'Kungsholmen', city: 'Stockholm',
      description: 'Island district in central Stockholm.',
      image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
      averagePrice: '610000', populationDensity: 7800, walkScore: 89, transitScore: 87,
      latitude: '59.3326', longitude: '18.0298', active: true
    }
  ];
  neighborhoodsSeed.forEach((n, i) => console.log(`Neighborhood seed [${i}]:`, n));
  await db.insert(neighborhoods).values(neighborhoodsSeed);
  console.log('Neighborhoods seeded.');

  // --- 4. PROPERTIES ---
  console.log('Seeding properties...');
  const propertyTypes = ['Apartment', 'Villa', 'House', 'Condo', 'Penthouse', 'Studio', 'Townhouse', 'Office', 'Shop', 'Land'];
  const listingTypes = ['sell', 'rent', 'buy', 'commercial', 'pg'];
  const propertiesSeed = [];
  let propertyId = 1;
  for (const location of insertedLocations) {
    for (const propertyType of propertyTypes) {
      for (const listingType of listingTypes) {
        propertiesSeed.push({
          title: `${propertyType} for ${listingType} in ${location.name}`,
          description: `A nice ${propertyType.toLowerCase()} for ${listingType} in ${location.name}.`,
          price: 300000 + Math.floor(Math.random() * 400000),
          address: `${propertyId} Main St, ${location.name}, ${location.country}`,
          city: location.name,
          area: 50 + Math.floor(Math.random() * 150),
          bedrooms: propertyType === 'Studio' ? 0 : 1 + Math.floor(Math.random() * 4),
          bathrooms: 1 + Math.floor(Math.random() * 2),
          propertyType,
          listingType,
          features: ['Balcony', 'Elevator', 'Parking'],
          images: [location.image],
          userId: propertyId % 2 === 0 ? agentUser.id : adminUser.id,
          latitude: (location.latitude ?? 0) + (Math.random() - 0.5) * 0.01,
          longitude: (location.longitude ?? 0) + (Math.random() - 0.5) * 0.01,
          featured: propertyId % 5 === 0,
          verified: propertyId % 3 === 0,
          status: 'active',
          transactionType: 'New',
          propertyOwnership: 'Freehold',
          flooringDetails: 'Wooden flooring',
          furnishingDetails: 'Fully Furnished',
          heatingAvailable: true,
          waterDetails: 'Municipal supply',
          gasDetails: 'Piped gas',
          ownerDetails: { name: propertyId % 2 === 0 ? agentUser.name : adminUser.name, contact: propertyId % 2 === 0 ? agentUser.email : adminUser.email },
          averageNearbyPrices: 320000 + Math.floor(Math.random() * 30000),
          registrationDetails: 'Fully registered with clear title',
        });
        propertyId++;
      }
    }
  }
  propertiesSeed.forEach((p, i) => {
    if (i < 5 || i === propertiesSeed.length - 1) // Only log first 5 and last for brevity
      console.log(`Property seed [${i}]:`, p);
    if (i === 5) console.log('...');
  });
  const insertedProperties = await db.insert(properties).values(propertiesSeed).returning();
  console.log('Properties seeded.');

  // --- 5. BLOG ARTICLES ---
  console.log('Seeding blog articles...');
  const blogPostsSeed = [
    {
      title: 'Buying a Home in Finland: What to Know',
      slug: 'buying-home-finland',
      content: 'Finland offers a stable and transparent real estate market...',
      authorId: agentUser.id,
      authorName: agentUser.name,
      category: 'Buying',
      excerpt: 'A guide to buying property in Finland for locals and expats.',
      metaDescription: 'Guide to buying property in Finland.',
      imageUrl: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
      readTimeMinutes: 5,
      isPublished: true,
      publishedAt: new Date(),
      tags: 'Finland,Buying,Guide'
    },
    {
      title: 'Stockholm Neighborhoods: Where to Live',
      slug: 'stockholm-neighborhoods',
      content: 'Stockholm is a city of islands, each with its own character...',
      authorId: regularUser.id,
      authorName: regularUser.name,
      category: 'Neighborhoods',
      excerpt: 'Explore the best areas to live in Stockholm.',
      metaDescription: 'Best neighborhoods in Stockholm.',
      imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
      readTimeMinutes: 4,
      isPublished: true,
      publishedAt: new Date(),
      tags: 'Stockholm,Neighborhoods,Guide'
    }
  ];
  blogPostsSeed.forEach((b, i) => console.log(`Blog post seed [${i}]:`, b));
  await db.insert(posts).values(blogPostsSeed);
  console.log('Blog articles seeded.');

  // --- 6. MESSAGES ---
  console.log('Seeding messages...');
  const messagesSeed = [
    {
      name: regularUser.name,
      email: regularUser.email,
      subject: 'Inquiry about Apartment in Helsinki',
      message: 'Is the apartment still available?',
      status: 'unread',
      propertyId: insertedProperties[0].id,
      userId: agentUser.id,
      senderUserId: regularUser.id,
      createdAt: new Date(),
    },
    {
      name: agentUser.name,
      email: agentUser.email,
      subject: 'Re: Inquiry about Apartment in Helsinki',
      message: 'Yes, it is available. Would you like to schedule a viewing?',
      status: 'unread',
      propertyId: insertedProperties[0].id,
      userId: regularUser.id,
      senderUserId: agentUser.id,
      createdAt: new Date(),
    }
  ];
  messagesSeed.forEach((m, i) => console.log(`Message seed [${i}]:`, m));
  await db.insert(messages).values(messagesSeed);
  console.log('Messages seeded.');

  // --- 7. FOOTER CONTENTS ---
  console.log('Seeding footer contents...');
  const footerContentsSeed = [
    { section: 'company', title: 'About Us', content: '', link: '/about', icon: 'ri-information-line', position: 1, active: true, openInNewTab: false },
    { section: 'company', title: 'Careers', content: '', link: '/careers', icon: 'ri-briefcase-line', position: 2, active: true, openInNewTab: false },
    { section: 'resources', title: 'Blog', content: '', link: '/blog', icon: 'ri-article-line', position: 1, active: true, openInNewTab: false },
    { section: 'resources', title: 'FAQ', content: '', link: '/faq', icon: 'ri-question-line', position: 2, active: true, openInNewTab: false },
    { section: 'legal', title: 'Privacy Policy', content: '', link: '/privacy-policy', icon: 'ri-lock-line', position: 1, active: true, openInNewTab: false },
    { section: 'legal', title: 'Terms of Service', content: '', link: '/terms-of-service', icon: 'ri-file-list-2-line', position: 2, active: true, openInNewTab: false },
    { section: 'social', title: 'Facebook', content: '', link: 'https://facebook.com', icon: 'ri-facebook-fill', position: 1, active: true, openInNewTab: true },
    { section: 'social', title: 'Twitter', content: '', link: 'https://twitter.com', icon: 'ri-twitter-fill', position: 2, active: true, openInNewTab: true },
    { section: 'bottom', title: 'Privacy Policy', content: '', link: '/privacy-policy', icon: '', position: 1, active: true, openInNewTab: false },
    { section: 'bottom', title: 'Terms of Service', content: '', link: '/terms-of-service', icon: '', position: 2, active: true, openInNewTab: false }
  ];
  footerContentsSeed.forEach((f, i) => console.log(`Footer content seed [${i}]:`, f));
  await db.insert(footerContents).values(footerContentsSeed);
  console.log('Footer contents seeded.');

  // --- 8. SITE SETTINGS ---
  console.log('Seeding site settings...');
  const siteSettingsSeed = {
    siteName: 'HomeHarbor',
    brandName: 'HomeHarbor',
    footerCopyright: `© ${new Date().getFullYear()} HomeHarbor. All rights reserved.`,
    contactPhone: '+358 123 456 789',
    contactEmail: 'info@homeharbor.com',
    defaultLanguage: 'en',
    showAdminLink: true,
    heroImageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1974&q=80'
  };
  console.log('Site settings seed:', siteSettingsSeed);
  await db.insert(settings).values({
    key: 'site',
    value: JSON.stringify(siteSettingsSeed),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Site settings seeded.');

  // --- 9. STATIC PAGES ---
  console.log('Seeding static pages...');
  const staticPagesSeed = [
    {
      slug: 'about',
      content: `
        <h1>About HomeHarbor</h1>
        <p>We're on a mission to make finding your dream home easier than ever before.</p>
        <h2>Our Story</h2>
        <p>Founded in 2022, HomeHarbor started with a simple idea: make the real estate journey transparent, efficient, and enjoyable for everyone. We recognized that finding a home is more than just a transaction; it's about finding a place where life happens.</p>
        <p>Our platform was built from the ground up with the needs of both buyers and sellers in mind. We combine cutting-edge technology with local market expertise to provide a seamless experience for everyone involved in the real estate process.</p>
        <p>Today, HomeHarbor has grown to become one of Europe's most trusted real estate platforms, connecting thousands of buyers with their dream homes and helping sellers get the best value for their properties.</p>
        <h2>Our Values</h2>
        <ul>
          <li><strong>Customer First:</strong> We always put our customers' needs at the center of everything we do, creating solutions that truly solve their problems.</li>
          <li><strong>Trust & Transparency:</strong> We believe in building long-term trust through honest communication and transparent practices at every step.</li>
          <li><strong>Innovation:</strong> We continuously push the boundaries of what's possible in real estate technology to create better experiences.</li>
        </ul>
        <h2>Our Leadership Team</h2>
        <ul>
          <li>Anna Schmidt – Chief Executive Officer</li>
          <li>Michael Weber – Chief Technology Officer</li>
          <li>Julia Fischer – Chief Marketing Officer</li>
          <li>Thomas Müller – Chief Financial Officer</li>
        </ul>
        <h2>Join Our Journey</h2>
        <p>Whether you're looking for your dream home or want to list your property, we're here to help you every step of the way.</p>
      `
    },
    {
      slug: 'faq',
      content: `
        <h1>Frequently Asked Questions</h1>
        <h2>General Questions</h2>
        <ul>
          <li><strong>What is HomeHarbor?</strong> HomeHarbor is a comprehensive real estate platform designed to help you find your perfect home. We provide property listings, advanced search tools, and personalized recommendations to simplify your property search experience.</li>
          <li><strong>How do I create an account?</strong> You can create an account by clicking on the 'Sign Up' button in the top right corner of the homepage. Fill in your details, verify your email, and you're ready to go. You can also sign up using your Google account for faster registration.</li>
          <li><strong>Is HomeHarbor available in my area?</strong> HomeHarbor currently serves major cities across Europe, including Berlin, Paris, Amsterdam, London, Munich, and many others. We're constantly expanding our coverage to include more locations.</li>
          <li><strong>Is the HomeHarbor service free to use?</strong> Yes, basic features of HomeHarbor are free for all users. This includes browsing listings, saving favorites, and contacting agents. We also offer premium features for property owners and agents that require a subscription.</li>
        </ul>
        <h2>Property Search</h2>
        <ul>
          <li><strong>How can I search for properties?</strong> You can search for properties using our search bar on the homepage. Enter a location, property type, or keyword to get started. For more specific searches, use our advanced filters to narrow down results by price range, number of bedrooms, amenities, and more.</li>
          <li><strong>Can I save my search criteria?</strong> Yes, registered users can save search criteria for future use. You can also set up alerts to receive notifications when new properties matching your criteria become available.</li>
          <li><strong>How accurate is the map view?</strong> Our maps feature uses precise geolocation data to show the approximate location of properties. For security and privacy reasons, exact locations of some properties may be slightly offset on the map, especially for rental properties.</li>
          <li><strong>Can I search for properties near specific amenities?</strong> Yes, our geolocation-based search allows you to find properties near schools, hospitals, parks, public transport, and other amenities. You can set a radius from a specific point and see all available properties within that area.</li>
        </ul>
        <h2>Property Listings</h2>
        <ul>
          <li><strong>How do I list my property on HomeHarbor?</strong> To list your property, create an account and click on 'Add Property' from your dashboard. Fill in the property details, upload photos, and submit your listing. Our team will review it before it goes live.</li>
          <li><strong>What information should I include in my listing?</strong> For the best results, include accurate details about your property's location, size, number of rooms, amenities, price, and high-quality photos. A detailed description highlighting key features will help attract more interested buyers or renters.</li>
          <li><strong>How long does it take for my listing to be approved?</strong> Typically, listings are reviewed and approved within 24-48 hours. You'll receive a notification once your listing is live on the platform.</li>
          <li><strong>Can I edit my listing after it's published?</strong> Yes, you can edit your listing details at any time from your dashboard. Updates to critical information like price or availability will be reflected immediately.</li>
        </ul>
        <h2>Real Estate Agents</h2>
        <ul>
          <li><strong>How do I contact an agent about a property?</strong> Each property listing has a 'Contact Agent' button that allows you to send a message directly to the listing agent. You can also schedule viewings through this feature.</li>
          <li><strong>How can I become a registered agent on HomeHarbor?</strong> Real estate professionals can register for an agent account by visiting our 'For Agents' page and completing the registration process. We verify all agent credentials before approving accounts.</li>
          <li><strong>What are the benefits of being a registered agent?</strong> Registered agents can create unlimited listings, receive leads directly, access detailed analytics on listing performance, and get featured in our agent directory. Premium agent subscriptions include additional marketing tools and priority placement.</li>
          <li><strong>How are agent ratings calculated?</strong> Agent ratings are based on verified client reviews, response times, listing quality, and overall platform activity. Clients can leave reviews after completing a transaction with an agent.</li>
        </ul>
        <h2>Technical Support</h2>
        <ul>
          <li><strong>The website is not loading properly. What should I do?</strong> Try clearing your browser cache and cookies, or try using a different browser. If problems persist, please contact our support team with details of the issue and screenshots if possible.</li>
          <li><strong>How do I reset my password?</strong> Click on 'Login', then select 'Forgot Password'. Enter your email address, and we'll send you a link to reset your password. Make sure to check your spam folder if you don't see the email in your inbox.</li>
          <li><strong>Is my personal information secure?</strong> Yes, we use industry-standard security measures to protect your data. All personal information is encrypted, and we never share your details with third parties without your consent. You can review our Privacy Policy for more details.</li>
          <li><strong>Can I use HomeHarbor on my mobile device?</strong> Yes, HomeHarbor is fully responsive and works on all devices. We also offer mobile apps for iOS and Android for an optimized mobile experience.</li>
        </ul>
      `
    },
    {
      slug: 'terms-of-service',
      content: `
        <h1>Terms of Service</h1>
        <p>Last Updated: April 12, 2025</p>
        <h2>1. Introduction</h2>
        <p>Welcome to HomeHarbor. These Terms of Service ("Terms") govern your access to and use of the HomeHarbor website, mobile applications, and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>
        <h2>2. Definitions</h2>
        <p><strong>"HomeHarbor"</strong> (or "we", "our", or "us") refers to the company operating the Service, its subsidiaries, and affiliates.</p>
        <p><strong>"User"</strong> (or "you" or "your") refers to any individual who accesses or uses the Service.</p>
        <p><strong>"Content"</strong> refers to any information, text, graphics, photos, or other materials uploaded, downloaded, or appearing on the Service.</p>
        <h2>3. Account Registration</h2>
        <p>To access certain features of the Service, you may be required to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself. You are responsible for safeguarding your password and for all activities that occur under your account.</p>
        <p>You must notify HomeHarbor immediately of any breach of security or unauthorized use of your account. HomeHarbor cannot and will not be liable for any loss or damage arising from your failure to comply with these requirements.</p>
        <h2>4. Property Listings</h2>
        <p>HomeHarbor provides a platform for real estate agents, property owners, and developers to list properties for sale or rent. HomeHarbor does not guarantee the accuracy, completeness, quality, or reliability of any listings, content, or communications on the Service.</p>
        <p>You acknowledge that any reliance on material posted by other users will be at your own risk. HomeHarbor has no obligation to screen communications or information in advance and is not responsible for screening or monitoring material posted by users.</p>
        <h2>5. User Content</h2>
        <p>Users are solely responsible for the content they submit to the Service. By submitting content to the Service, you grant HomeHarbor a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content.</p>
        <p>You represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to publish the content you submit; and that your content does not infringe or violate the rights of any third party.</p>
        <h2>6. Prohibited Activities</h2>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe the rights of others, including patent, trademark, trade secret, copyright, privacy, publicity, or other proprietary rights</li>
          <li>Use the Service for any illegal or unauthorized purpose</li>
          <li>Post unauthorized commercial communications</li>
          <li>Upload viruses or other malicious code</li>
          <li>Solicit login information or access an account belonging to someone else</li>
          <li>Engage in unlawful multi-level marketing</li>
          <li>Impersonate another person or entity</li>
          <li>Engage in any form of automated data collection or extraction</li>
        </ul>
        <h2>7. Intellectual Property</h2>
        <p>All content included on the Service, such as text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software, is the property of HomeHarbor or its content suppliers and is protected by international copyright laws.</p>
        <h2>8. Termination</h2>
        <p>HomeHarbor reserves the right to terminate or suspend your account and access to the Service at any time, without prior notice or liability, for any reason.</p>
        <h2>9. Disclaimer of Warranties</h2>
        <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. HomeHarbor disclaims all warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
        <h2>10. Limitation of Liability</h2>
        <p>In no event shall HomeHarbor be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
        <h2>11. Changes to Terms</h2>
        <p>HomeHarbor reserves the right to modify or replace these Terms at any time. It is your responsibility to check these Terms periodically for changes. Your continued use of the Service following the posting of any changes constitutes acceptance of those changes.</p>
        <h2>12. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of the European Union, without regard to its conflict of law provisions.</p>
        <h2>13. Contact Information</h2>
        <p>If you have any questions about these Terms, please contact us at legal@homeharbor.com.</p>
      `
    },
    {
      slug: 'privacy-policy',
      content: `
        <h1>Privacy Policy</h1>
        <p>Last Updated: April 12, 2025</p>
        <h2>1. Introduction</h2>
        <p>HomeHarbor ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, mobile application, and use our services (collectively, the "Service").</p>
        <p>Please read this Privacy Policy carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.</p>
        <h2>2. Information We Collect</h2>
        <p>We collect several types of information from and about users of our Service, including:</p>
        <h3>2.1 Personal Information</h3>
        <p>Personal information is data that can be used to identify you individually. We may collect the following personal information:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Postal address</li>
          <li>Username and password</li>
          <li>Profile picture</li>
          <li>Identification documents (for verification purposes)</li>
          <li>Payment information</li>
        </ul>
        <h3>2.2 Usage Information</h3>
        <p>We automatically collect certain information about your equipment, browsing actions, and patterns, including:</p>
        <ul>
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>Time and date of your visit</li>
          <li>Pages you viewed or searched for</li>
          <li>Page response times</li>
          <li>Length of visits to certain pages</li>
          <li>Referring website addresses</li>
          <li>Property search preferences</li>
          <li>Interaction with listings</li>
          <li>Geolocation data (with your consent)</li>
        </ul>
        <h2>3. How We Collect Information</h2>
        <p>We collect information through:</p>
        <ul>
          <li>Direct interactions when you register an account, save properties, contact agents, or use our Service</li>
          <li>Automated technologies such as cookies, web beacons, and similar tracking technologies</li>
          <li>Third parties or publicly available sources</li>
        </ul>
        <h2>4. How We Use Your Information</h2>
        <p>We use the information we collect about you or that you provide to us, including any personal information:</p>
        <ul>
          <li>To provide, maintain, and improve our Service</li>
          <li>To process transactions and send related information</li>
          <li>To send administrative notifications, such as security or support messages</li>
          <li>To personalize your experience and deliver content relevant to your interests</li>
          <li>To respond to your comments, questions, and requests</li>
          <li>To monitor and analyze trends, usage, and activities in connection with our Service</li>
          <li>To detect, prevent, and address technical issues or fraudulent transactions</li>
          <li>For any other purpose with your consent</li>
        </ul>
        <h2>5. Disclosure of Your Information</h2>
        <p>We may disclose personal information that we collect or you provide:</p>
        <ul>
          <li>To our subsidiaries and affiliates</li>
          <li>To contractors, service providers, and other third parties we use to support our business</li>
          <li>To a buyer or other successor in the event of a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of HomeHarbor's assets</li>
          <li>To fulfill the purpose for which you provide it</li>
          <li>For any other purpose disclosed by us when you provide the information</li>
          <li>With your consent</li>
          <li>To comply with any court order, law, or legal process, including to respond to any government or regulatory request</li>
          <li>To enforce or apply our Terms of Service and other agreements</li>
          <li>If we believe disclosure is necessary or appropriate to protect the rights, property, or safety of HomeHarbor, our customers, or others</li>
        </ul>
        <h2>6. Your Choices</h2>
        <p>We strive to provide you with choices regarding the personal information you provide to us. You can:</p>
        <ul>
          <li>Update your account information by logging into your account</li>
          <li>Opt-out of receiving promotional emails by following the unsubscribe link in those emails</li>
          <li>Opt-out of location tracking through your device settings</li>
          <li>Manage cookies through your browser settings</li>
        </ul>
        <h2>7. Data Security</h2>
        <p>We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers.</p>
        <p>Unfortunately, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Service.</p>
        <h2>8. Data Retention</h2>
        <p>We will retain your personal information only for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements.</p>
        <h2>9. International Data Transfers</h2>
        <p>Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.</p>
        <p>If you are located outside the European Union and choose to provide information to us, please note that we transfer the data, including personal information, to the European Union and process it there.</p>
        <h2>10. Children's Privacy</h2>
        <p>Our Service is not intended for children under the age of 16, and we do not knowingly collect personal information from children under 16. If we learn we have collected or received personal information from a child under 16, we will delete that information.</p>
        <h2>11. Changes to Our Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.</p>
        <h2>12. Contact Information</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at: privacy@homeharbor.com.</p>
      `
    }
  ];
  staticPagesSeed.forEach((s, i) => console.log(`Static page seed [${i}]:`, s));
  for (const page of staticPagesSeed) {
    await db.insert(staticPages).values(page).onConflictDoUpdate({
      target: staticPages.slug,
      set: { content: page.content }
    });
  }
  console.log('Static pages seeded.');

  console.log('Database seeding completed successfully!');
}

// Note: This file is imported by server/index.ts, so we don't need
// to check if it's being run directly in an ES module context