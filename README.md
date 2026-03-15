# H14B_CoolCoolCool

Order Creation API that generates UBL 2.1 XML documents from structured JSON input. 
Built as part of a SaaS ecosystem for digital trade document exchange.

## Tech Stack
- Node.js + Express
- PostgreSQL (Supabase)
- Prisma ORM
- Swagger UI for API documentation
- Jest for testing
- Deployed on Vercel

## Environment Variables
Create a `.env` file in the project root:
DATABASE_URL="postgresql://..."

## Run Tests
npm test

## API Endpoints - MVP Sprint 2
| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Health check |
| POST | /orders | Create order and generate UBL XML |
| GET | /orders/:id | Retrieve order and UBL XML |
| PUT | /orders/:id | Update order and regenerate UBL XML |
| DELETE | /orders/:id | Delete an order |
| GET | /orders | Retrieve all order and related UBL XML optianlly filtered by order status and/or buyerId|

## Swagger Documentation
- Production url: https://h14-b-cool-cool-cool.vercel.app/api-docs
- Swagger UI: `http://localhost:3000/api-docs`

## Inputs: Accepted & Omitted

**UBL 2.1 Fields Included**

Document level:
- `UBLVersionID`
- `ID`
- `IssueDate`
- `Note`
- `DocumentCurrencyCode`
- `OrderDocumentReference` order amendment flow

Buyer:
- `PartyName/Name`
- `PostalAddress` (StreetName, CityName, PostalZone, Country)
- `PartyTaxScheme` (CompanyID, TaxScheme/ID)
- `PartyLegalEntity/CompanyID` - required by Invoice generator
- `Contact` (Name, Telephone, ElectronicMail)

Seller:
- `PartyName/Name`
- `PostalAddress` (StreetName, CityName, PostalZone, Country)
- `PartyTaxScheme` (CompanyID, TaxScheme/ID)
- `PartyLegalEntity/CompanyID` - required by Invoice generator
- `Contact` (Name, Telephone, ElectronicMail)

Delivery:
- `DeliveryLocation/Address` (StreetName, CityName, PostalZone, Country)
- `RequestedDeliveryPeriod` (StartDate, EndDate)

Tax:
- `TaxTotal/TaxAmount`
- `TaxTotal/TaxSubtotal/TaxableAmount` - required by Invoice generator
- `TaxTotal/TaxSubtotal/TaxCategory/Percent` - required by Invoice generator
- `TaxTotal/TaxSubtotal/TaxCategory/TaxScheme/ID` - required by Invoice generator

Monetary Total:
- `AnticipatedMonetaryTotal/LineExtensionAmount`
- `AnticipatedMonetaryTotal/PayableAmount`

Per line:
- `LineItem/ID`
- `LineItem/Quantity` + `unitCode`
- `LineItem/LineExtensionAmount`
- `LineItem/Price/PriceAmount`
- `LineItem/Price/BaseQuantity`
- `LineItem/Item/Name`
- `LineItem/Item/Description`
- `LineItem/Item/SellersItemIdentification/ID`

\
\
**UBL 2.1 Fields Excluded**

Document level:
- `CustomizationID`
- `ProfileID`
- `IssueTime` - date is sufficient for MVP
- `AccountingCostCode` - internal project cost code, not relevant

Document references:
- `QuotationDocumentReference` - no quoting system
- `OriginatorDocumentReference` - not relevant
- `AdditionalDocumentReference` - file attachments out of scope
- `Contract` - no contract management

Buyer extras:
- `EndpointID` - GLN network identifier, not relevant
- `PartyIdentification` - additional party IDs not needed
- `AdditionalStreetName`, `BuildingNumber`, `Department`, `Postbox` - extended address fields out of scope
- `CountrySubentity` - region/state not needed
- `Person` (FirstName, FamilyName, MiddleName, JobTitle) - individual person details out of scope
- `DeliveryContact` - separate delivery contact not needed
- `SupplierAssignedAccountID` - seller's account number for buyer not relevant

Seller extras:
- `EndpointID` - GLN network identifier, not relevant
- `PartyIdentification` - additional party IDs not needed
- `AdditionalStreetName`, `BuildingNumber`, `Department`, `Postbox` - extended address fields out of scope
- `CountrySubentity` - region/state not needed
- `Person` (FirstName, FamilyName, MiddleName, JobTitle) — out of scope
- `BuyerAssignedAccountID` - buyer's account number for seller not relevant

Originator:
- `OriginatorCustomerParty` - person who initiated order on behalf of buyer, not relevant

Delivery extras:
- `DeliveryParty` - separate trucking/logistics company, not relevant
- `DeliveryTerms` - Incoterms like FOT/CAD, not in scope

Allowances:
- `AllowanceCharge` - document level charges and discounts, not in scope

Monetary total extras:
- `AllowanceTotalAmount` - total of all discounts, no allowances in scope
- `ChargeTotalAmount` - total of all charges, no charges in scope

Per line extras:
- `TotalTaxAmount` - tax handled at document level only
- `PartialDeliveryIndicator` - partial delivery not in scope
- `AccountingCostCode` - internal cost code per line, not relevant
- `LineItem/Delivery` - per line delivery period, document level delivery only
- `OriginatorParty` - who initiated this specific line, not needed
- `StandardItemIdentification` - GTIN barcode, not in scope
- `AdditionalItemProperty` - extra product properties like colour and size, not in scope
