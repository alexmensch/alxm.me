/**
 * Legal details of the company both sites' services are provided through.
 */

const address = {
  street: "82A James Carter Road",
  locality: "Mildenhall",
  region: "England",
  postalCode: "IP28 7DE",
  country: "GB"
};

export const company = {
  name: "Thoughtful Design Ltd",
  shortName: "Thoughtful Design",
  number: "15642102",
  vat: "GB465435281",
  address,
  addressLine: [
    address.street,
    address.locality,
    address.region,
    address.postalCode
  ].join(", ")
};
