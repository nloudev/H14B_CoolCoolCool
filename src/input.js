const fs = require('node:fs');
const path = require('node:path');

function create_xml(inputs) {
  if (!inputs || !inputs.order) return;

  const currency = inputs.order.currencyID;
  const taxRate = inputs.tax.taxPercent / 100;

  const lineExtensionAmount = inputs.items.reduce((sum, item) => sum + (item.quantity * item.priceAmount), 0);
  const taxAmount = lineExtensionAmount * taxRate;
  const payableAmount = lineExtensionAmount + taxAmount;

  // Map items with a blank line between each <cac:OrderLine> block
  const itemsXml = inputs.items.map(item => `
  <cac:OrderLine>
    <cac:LineItem>
      <cbc:ID>${item.id}</cbc:ID>
      <cbc:Quantity unitCode="${item.unitCode}">${item.quantity}</cbc:Quantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${(item.quantity * item.priceAmount).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${item.priceAmount.toFixed(2)}</cbc:PriceAmount>
        <cbc:BaseQuantity unitCode="${item.unitCode}">1</cbc:BaseQuantity>
      </cac:Price>
      <cac:Item>
        <cbc:Description>${item.product.description}</cbc:Description>
        <cbc:Name>${item.product.name}</cbc:Name>
        <cac:SellersItemIdentification>
          <cbc:ID>${item.product.sellersItemId}</cbc:ID>
        </cac:SellersItemIdentification>
      </cac:Item>
    </cac:LineItem>
  </cac:OrderLine>`).join('\n');

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<Order xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2"
       xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
       xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${inputs.order.id}</cbc:ID>
  <cbc:IssueDate>${inputs.order.issueDate}</cbc:IssueDate>
  <cbc:Note>${inputs.order.note || ''}</cbc:Note>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cac:OrderDocumentReference>
    <cbc:ID>${inputs.order.orderDocumentReference || ''}</cbc:ID>
  </cac:OrderDocumentReference>
  
  <cac:BuyerCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${inputs.buyer.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${inputs.buyer.street}</cbc:StreetName>
        <cbc:CityName>${inputs.buyer.city}</cbc:CityName>
        <cbc:PostalZone>${inputs.buyer.postalCode}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${inputs.buyer.countryCode}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${inputs.buyer.companyId}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>${inputs.buyer.taxSchemeId}</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:CompanyID>${inputs.buyer.legalEntityId}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${inputs.buyer.contactName}</cbc:Name>
        <cbc:Telephone>${inputs.buyer.contactPhone}</cbc:Telephone>
        <cbc:ElectronicMail>${inputs.buyer.contactEmail}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:BuyerCustomerParty>

  <cac:SellerSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${inputs.seller.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${inputs.seller.street}</cbc:StreetName>
        <cbc:CityName>${inputs.seller.city}</cbc:CityName>
        <cbc:PostalZone>${inputs.seller.postalCode}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${inputs.seller.countryCode}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${inputs.seller.companyId}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>${inputs.seller.taxSchemeId}</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:CompanyID>${inputs.seller.legalEntityId}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${inputs.seller.contactName}</cbc:Name>
        <cbc:Telephone>${inputs.seller.contactPhone}</cbc:Telephone>
        <cbc:ElectronicMail>${inputs.seller.contactEmail}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:SellerSupplierParty>

  <cac:Delivery>
    <cac:DeliveryLocation>
      <cac:Address>
        <cbc:StreetName>${inputs.delivery.street}</cbc:StreetName>
        <cbc:CityName>${inputs.delivery.city}</cbc:CityName>
        <cbc:PostalZone>${inputs.delivery.postalCode}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${inputs.delivery.countryCode}</cbc:IdentificationCode>
        </cac:Country>
      </cac:Address>
    </cac:DeliveryLocation>
    <cac:RequestedDeliveryPeriod>
      <cbc:StartDate>${inputs.delivery.requestedStartDate}</cbc:StartDate>
      <cbc:EndDate>${inputs.delivery.requestedEndDate}</cbc:EndDate>
    </cac:RequestedDeliveryPeriod>
  </cac:Delivery>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${taxAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${lineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>${inputs.tax.taxPercent.toFixed(1)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>${inputs.tax.taxTypeCode}</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:AnticipatedMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:PayableAmount currencyID="${currency}">${payableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:AnticipatedMonetaryTotal>
${itemsXml}

</Order>`;

  fs.writeFileSync('src/creation_output.xml', content, 'utf8');
}
module.exports = { create_xml };