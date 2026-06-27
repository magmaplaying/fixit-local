-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "phone" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceType" TEXT NOT NULL DEFAULT 'HOURLY',
    "price" REAL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Listing_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "scheduledFor" DATETIME,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Listing_categoryId_idx" ON "Listing"("categoryId");

-- CreateIndex
CREATE INDEX "Listing_city_idx" ON "Listing"("city");

-- CreateIndex
CREATE INDEX "Booking_listingId_idx" ON "Booking"("listingId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_listingId_idx" ON "Review"("listingId");
