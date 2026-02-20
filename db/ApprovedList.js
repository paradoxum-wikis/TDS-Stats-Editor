/**
 * Tower Approval Lists
 * This file contains the lists of towers that are verified or featured
 *
 * approvedTowers: Towers that have passed verification and don't show the "unverified" tag
 * featuredTowers: Towers that are highlighted as featured content
 * grandfatheredTowers: Towers that are exempt from verification requirements (first 7 BETA submissions)
 * highlights: Towers that appear in the highlights section at the top of the page
 *
 * Add or remove entries as needed
 */

// List of verified towers that won't have the unverified tag
const approvedTowers = [
  "Bman Shadow/Harvester 2.0",
  "Gabonnie/Anubis Tower",
  "Gabonnie/Accelerator",
  "ImAllOutOfNames/LIBERATOR TOWER CONCEPT",
  "Phidoductom1/Jesus the Navereth",
  "Vessel Of Infinite Destruction/Ranger",
  "Vessel Of Infinite Destruction/Golden Cowboy",
  "Brainhead1r/Hunter",
  "Bman Shadow/Stewie griffin",
  "Bman Shadow/Warden rework",
  "Raspbelle/Accelerator Rebalance 1",
  "Raspbelle/Accelerator Rebalance Path 2",
  "Raspbelle/Ace Pilot Rebalance Path 1",
  "Raspbelle/Ace Pilot Rebalance Path 2",
  "Raspbelle/Archer Rebalance Path 1",
  "Raspbelle/Archer Rebalance Path 2",
  "Raspbelle/Tsukasa Tower",
  "Raspbelle/Crook Boss",
  "Onett4smash/Tsukasa Tower (but JSON)",
  "Vessel Of Infinite Destruction/Military Base",
  "Onett4smash/Ranger Rework (V1)",
  "Onett4smash/Slasher Rework",
  "Your nameless protagonist/Enforcer",
  "Chilloutofpewp2nd/Mecha Base",
  "Chilloutofpewp2nd/Gatling",
  "Chilloutofpewp2nd/Turret",
  "Chilloutofpewp2nd/War Machine",
  "Onett4smash/Paintballer Rework",
  "Chilloutofpewp2nd/Medic",
  "Onett4smash/Medic Rework (V1)",
  "Chilloutofpewp2nd/Militant",
  "Chilloutofpewp2nd/Gatling (Rework",
  "Onett4smash/Commander Rework (V1)",
  "Onett4smash/Brawler Rework (V1)",
  "Chilloutofpewp2nd/DJ Booth Rebalance",
  "ArtZthecoolguy/Scrambler Tower",
  "Onett4smash/Sniper Rework",
  "Hellscream2008/Paint Baller Rework",
  "Hellscream2008/John Tower!",
  "Hellscream2008/Turret Rework!",
  "ImAllOutOfNames/Medic",
  "Onett4smash/Medic Rework (V2)",
  "BertoYT/Gladiator",
  "Hellscream2008/Scout - Mass Rework!",
  "GubbyTheGoat69/Gladiator(meta rework)",
  "Midzislaw/Jester",
  "Vessel Of Infinite Destruction/Golden Crook Boss",
  "Paccet/Accelerator (REWORK)",
  "Paccet/Gladiator (REBALANCE)",
  "Paccet/Ace Pilot (Balance)",
  "Sharkepicgamer07/Engineer Rebalance",
  "Hellscream2008/Acidinator (Rebalanced)",
  "Hellscream2008/Acidinator",
  "Hellscream2008/Sniper but with ability",
  "Hellscream2008/Paintballer but with ability",
  "Hellscream2008/Demoman but with ability",
  "Hellscream2008/Hunter but with ability",
  "Hellscream2008/Soldier but with ability",
  "Hellscream2008/Militant but with ability",
  "Vessel Of Infinite Destruction/Militant",
  "Vessel Of Infinite Destruction/Soldier",
  "Vessel Of Infinite Destruction/Scout",
  "Vessel Of Infinite Destruction/Turret",
  //  "Vessel Of Infinite Destruction/Toxic Gunner",
  "Hellscream2008/Lucky Shooter",
  "Vessel Of Infinite Destruction/Gatling Gunner",
  "Vessel Of Infinite Destruction/Golden Engineer",
  "Vessel Of Infinite Destruction/Golden Mortar",
  "Hellscream2008/War Machine + (Top path)",
  "Hellscream2008/War Machine + (Bottom path)",
  "NoobGlitch/Recruit",
  "Vessel Of Infinite Destruction/Paintballer",
  "EconomyOnRoblox/Gladiator",
  "Yanboblox22/Suppliant",
  "Vessel Of Infinite Destruction/Firework Technician",
  "Vessel Of Infinite Destruction/Minigunner",
  "Vessel Of Infinite Destruction/Accelerator",
];

// List of featured towers
const featuredTowers = [
  "Vessel Of Infinite Destruction/Ranger",
  "Raspbelle/Tsukasa Tower",
  "Vessel Of Infinite Destruction/Military Base",
  "Your nameless protagonist/Enforcer",
  "Onett4smash/Medic Rework (V1)",
  "Hellscream2008/John Tower!",
  "Onett4smash/Tsukasa Tower (but JSON)",
  "Vessel Of Infinite Destruction/Golden Crook Boss",
  "Hellscream2008/Acidinator (Rebalanced)",
  "Hellscream2008/Acidinator",
  "Vessel Of Infinite Destruction/Militant",
  "Vessel Of Infinite Destruction/Golden Cowboy",
  "Vessel Of Infinite Destruction/Soldier",
  "Vessel Of Infinite Destruction/Scout",
  "Vessel Of Infinite Destruction/Toxic Gunner",
  "Hellscream2008/Lucky Shooter",
  "Vessel Of Infinite Destruction/Golden Engineer",
  "Vessel Of Infinite Destruction/Golden Mortar",
  "Vessel Of Infinite Destruction/Paintballer",
  "Yanboblox22/Suppliant",
  "Vessel Of Infinite Destruction/Firework Technician",
  "Vessel Of Infinite Destruction/Accelerator",
];

// List of grandfathered towers
const grandfatheredTowers = [
  "Bman Shadow/Harvester 2.0",
  "Gabonnie/Anubis Tower",
  "Gabonnie/Accelerator",
  "ImAllOutOfNames/LIBERATOR TOWER CONCEPT",
  "Phidoductom1/Jesus the Navereth",
  "Vessel Of Infinite Destruction/Golden Cowboy",
  "Vessel Of Infinite Destruction/Ranger",
];

// its own section the page
const highlights = [
  "Vessel Of Infinite Destruction/Golden Engineer",
  "Vessel Of Infinite Destruction/Golden Mortar",
  "Vessel Of Infinite Destruction/Firework Technician",
  "Vessel Of Infinite Destruction/Accelerator",
];

window.approvedTowers = approvedTowers;
window.featuredTowers = featuredTowers;
window.grandfatheredTowers = grandfatheredTowers;
window["highlights"] = highlights;
