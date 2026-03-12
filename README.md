# H14B_CoolCoolCool

Minimal Node.js + Express API with Swagger documentation.

## Run locally

1. Install dependencies:

	```bash
	npm install
	```

2. Start the server:

	```bash
	npm start
	```

3. Open:

- API health: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`


## TODO for MVP:

Look at expected input/output in /src

Write the `POST /orders` endpoint that accepts the JSON and returns the XML

Write the `GET /orders/{id}` endpoint that retrieves a stored order

Write the `PUT /orders/{id}` endpoint that updates a record and regenerates the XML

Write the `DELETE /orders/{id}` endpoint that removes the record
 
Interfaces to implement:

| Route Name | Description | Parameters | Return | CRUD |
|---|---|---|---|---|
| `/orders` FR-01, FR-08, FR-11 | Place a new order and generate a UBL 2.1 XML document | Body containing: `order: { id: string, issueDate: date, note: string (optional), currencyID: string, orderDocumentReference: string (optional) }` `buyer: { name: string, street: string, city: string, postalCode: string, countryCode: string, companyId: string, legalEntityId: string, taxSchemeId: string, contactName: string, contactPhone: string, contactEmail: string }` `seller: { name: string, street: string, city: string, postalCode: string, countryCode: string, companyId: string, legalEntityId: string, taxSchemeId: string, contactName: string, contactPhone: string, contactEmail: string }` `delivery: { street: string, city: string, postalCode: string, countryCode: string, requestedStartDate: date, requestedEndDate: date }` `tax: { taxTypeCode: string, taxPercent: float }` `items: array of { id: string, product: { sellersItemId: string, name: string, description: string }, quantity: int, unitCode: string, priceAmount: float }` `loyaltyPointsRedeemed: int (optional)` | HTTP 200: `{ orderId: int, status: string, totalCost: float, taxAmount: float, payableAmount: float, anticipatedMonetaryTotal: float, loyaltyPointsEarned: int, loyaltyPointsRedeemed: int, ublDocument: string (XML) }`, HTTP 400: Bad request from client, HTTP 401: Token is invalid, HTTP 422: Invalid or missing required field | POST |
| `/orders/{id}` FR-01, FR-03 | Retrieve a stored order and its generated UBL 2.1 XML | Path: `id` (int) | HTTP 200: `{ orderId: int, status: string, totalCost: float, taxAmount: float, payableAmount: float, anticipatedMonetaryTotal: float, createdAt: datetime, ublDocument: string (XML) }`, HTTP 401: Token is invalid, HTTP 404: Order not found | GET |
| `/orders/{id}` FR-01, FR-03 | Update order fields and regenerate UBL 2.1 XML | Path: `id` (int) Body containing (all optional, at least one required): `order: { issueDate: date, note: string, currencyID: string, orderDocumentReference: string }` `buyer: { name: string, street: string, city: string, postalCode: string, countryCode: string, companyId: string, legalEntityId: string, taxSchemeId: string, contactName: string, contactPhone: string, contactEmail: string }` `seller: { name: string, street: string, city: string, postalCode: string, countryCode: string, companyId: string, legalEntityId: string, taxSchemeId: string, contactName: string, contactPhone: string, contactEmail: string }` `delivery: { street: string, city: string, postalCode: string, countryCode: string, requestedStartDate: date, requestedEndDate: date }` `tax: { taxTypeCode: string, taxPercent: float }` `items: array of { id: string, product: { sellersItemId: string, name: string, description: string }, quantity: int, unitCode: string, priceAmount: float }` | HTTP 200: `{ orderId: int, status: string, totalCost: float, taxAmount: float, payableAmount: float, anticipatedMonetaryTotal: float, ublDocument: string (XML) }`, HTTP 400: Bad request from client HTTP 401: Token is invalid HTTP, 404: Order not found, HTTP 422: No valid fields provided | PUT |
| `/orders/{id}` FR-01 | Delete an order record | Path: `id` (int) | HTTP 200: `{ message: string }`, HTTP 401: Token is invalid HTTP 404: Order not found | DELETE |


Feilds calculated by the API (not in JSON input):


`Per item:
LineExtensionAmount = quantity × priceAmount
e.g.
LINE-1: 2 × 299.99 = 599.98
LINE-2: 1 × 29.99 = 29.99`


`BaseQuantity = always 1 (hardcoded, not passed)`

`Tax total:
TaxableAmount = sum of all LineExtensionAmounts = 599.98 + 29.99 = 629.97
TaxAmount = TaxableAmount × (taxPercent / 100) = 629.97 × 0.10 = 63.00`

`Anticipated monetary total:
LineExtensionAmount = sum of all line LineExtensionAmounts = 629.97
PayableAmount = LineExtensionAmount + TaxAmount = 629.97 + 63.00 = 692.97`

Also auto-generated (not in JSON, not calculated from inputs):

`UBLVersionID = always hardcoded as "2.1"`
`TaxScheme/ID in TaxSubtotal = copied from tax.taxTypeCode = "GST"`
`currencyID attribute on every monetary amount = copied from order.currencyID = "AUD"`


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
