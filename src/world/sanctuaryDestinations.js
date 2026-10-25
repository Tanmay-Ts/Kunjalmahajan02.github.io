// Positions measured from the live Sanctuary's 1672 x 941 composition.
export const sanctuaryDestinations = [
  { id: 'projects', name: 'Projects', place: 'The Glasshouse', caption: 'things I’ve grown, built and tended', focus: [1290 / 1672, 400 / 941], label: [1350 / 1672, 192 / 941], mobileLabel: [1340 / 1672, 250 / 941], mode: 'above', mobileMode: 'above', zoom: 1.95, arrival: [0.60, 0.43] },
  { id: 'research', name: 'Research', place: 'The Observatory', caption: 'what I’m reading & looking up at', focus: [452 / 1672, 270 / 941], label: [452 / 1672, 125 / 941], mobileLabel: [400 / 1672, 530 / 941], mode: 'above', mobileMode: 'below', zoom: 2.7, arrival: [0.73, 0.44] },
  { id: 'creative', name: 'Creative', place: 'The Pavilion', caption: 'dance, art & the stage', focus: [760 / 1672, 240 / 941], label: [910 / 1672, 202 / 941], mobileLabel: [780 / 1672, 232 / 941], mode: 'side', mobileMode: 'above', zoom: 2.5, arrival: [0.55, 0.38] },
  { id: 'contact', name: 'Contact', place: 'The Post Garden', caption: 'letters, résumé & ways to say hi', focus: [650 / 1672, 470 / 941], label: [805 / 1672, 444 / 941], mobileLabel: [790 / 1672, 470 / 941], mode: 'side', mobileMode: 'side', zoom: 2.6, arrival: [0.72, 0.43] },
];
export const sanctuaryDestinationById = Object.fromEntries(sanctuaryDestinations.map(destination => [destination.id, destination]));
