// script.js — Dungeon Loot Splitter 
//
// The program is event-driven: it stays idle until the user clicks a button.
// Add Loot stores an item and re-renders the list; Split Loot divides the total
// evenly among the party. All output appears inside the page (no alert, prompt,
// console.log, or document.write).

"use strict";

// One array holds every loot item as an object { name, value }. It is declared
// at the top level so the data persists across separate button clicks instead
// of resetting each time a handler runs.
const lootItems = [];

// Fixed constants use PascalCase per the class coding standard. A loot value
// may be zero but never negative; a party must have at least one member.
const MinLootValue = 0;
const MinPartySize = 1;

// Element references (accessed only with getElementById, as required)
const partySizeInput = document.getElementById("party-size");
const lootNameInput = document.getElementById("loot-name");
const lootValueInput = document.getElementById("loot-value");
const addLootButton = document.getElementById("add-loot-button");
const splitLootButton = document.getElementById("split-loot-button");
const lootListOutput = document.getElementById("loot-list");
const runningTotalOutput = document.getElementById("running-total");
const finalTotalOutput = document.getElementById("final-total");
const perMemberOutput = document.getElementById("per-member");
const lootMessageOutput = document.getElementById("loot-message");
const splitMessageOutput = document.getElementById("split-message");

// Helper functions
// User text is placed into innerHTML when rendering, so it is escaped first.
// Without this, characters like < or & could break the markup or inject HTML.
function escapeHtml(text) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  };

  let result = "";

  for (let i = 0; i < text.length; i += 1) {
    const character = text.charAt(i);
    result += replacements[character] || character;
  }

  return result;
}

// Formats a number as currency with exactly two decimal places. toFixed(2) is
// used so every value always shows cents (e.g. 75 becomes "$75.00").
function formatCurrency(amount) {
  return "$" + amount.toFixed(2);
}

// Adds up every loot value with a traditional for loop, reading each object's
// value with dot notation. Shared by the running total and the split so the
// summing loop is written once and reused.
function calculateTotal() {
  let total = 0;

  for (let i = 0; i < lootItems.length; i += 1) {
    total += lootItems[i].value;
  }

  return total;
}

// Validates the loot entry inputs. Returns an object so the caller can both
// decide whether to store the item and show the correct message on the page.
function validateLoot(name, rawValue) {
  // Convert once so the numeric form is available to the checks below.
  const numericValue = Number(rawValue);

  if (name.length === 0) {
    return { isValid: false, message: "Please enter a loot name." };
  }

  // Number("") is 0 (not NaN), so an empty value field is caught explicitly.
  if (rawValue.length === 0) {
    return { isValid: false, message: "Please enter a loot value." };
  }

  // Number.isNaN avoids the type coercion of the global isNaN.
  if (Number.isNaN(numericValue)) {
    return { isValid: false, message: "Loot value must be a valid number." };
  }

  if (numericValue < MinLootValue) {
    return { isValid: false, message: "Loot value cannot be negative." };
  }

  return { isValid: true, message: "", value: numericValue };
}

// Validates the party size before a split. The party must be a number of at
// least one member.
function validatePartySize(rawValue) {
  const numericValue = Number(rawValue);

  if (rawValue.length === 0) {
    return { isValid: false, message: "Please enter the number of party members." };
  }

  if (Number.isNaN(numericValue)) {
    return { isValid: false, message: "Party size must be a valid number." };
  }

  if (numericValue < MinPartySize) {
    return { isValid: false, message: "Party size must be at least 1." };
  }

  return { isValid: true, message: "", value: numericValue };
}

// Renders the loot list and the running Total Loot. A for loop builds the whole
// list as one string, which is then written to the DOM a single time (the DOM
// is never updated inside the loop).
function renderLoot() {
  let listMarkup = "";

  if (lootItems.length === 0) {
    listMarkup = "<li class=\"empty\">No loot yet. Add your first item above.</li>";
  } else {
    for (let i = 0; i < lootItems.length; i += 1) {
      const currentItem = lootItems[i];
      const safeName = escapeHtml(currentItem.name);
      const safeValue = formatCurrency(currentItem.value);

      listMarkup += "<li>";
      listMarkup += "<span class=\"loot-name\">" + safeName + "</span>";
      listMarkup += "<span class=\"loot-value\">" + safeValue + "</span>";
      listMarkup += "</li>";
    }
  }

  lootListOutput.innerHTML = listMarkup;
  runningTotalOutput.textContent = "Total Loot: " + formatCurrency(calculateTotal());
}

// Event handlers
// Reads the loot inputs, validates them, stores a valid item as an object in
// the array, then re-renders the list and running total.
function addLoot() {
  // Trim the name so spaces alone are not treated as a valid item.
  const enteredName = lootNameInput.value.trim();
  const enteredValue = lootValueInput.value.trim();
  const result = validateLoot(enteredName, enteredValue);

  // Invalid data is never pushed into the array; show the reason and stop.
  if (!result.isValid) {
    lootMessageOutput.textContent = result.message;
    return;
  }

  const newLoot = {
    name: enteredName,
    value: result.value
  };

  lootItems.push(newLoot);

  lootMessageOutput.textContent = "";
  renderLoot();

  // Reset the entry fields and return focus for quick repeat entry.
  lootNameInput.value = "";
  lootValueInput.value = "";
  lootNameInput.focus();
}

// Splits the total loot evenly among the party. Validates that loot exists and
// the party size is valid before calculating, then displays the results.
function splitLoot() {
  // Edge case: there is nothing to split yet.
  if (lootItems.length === 0) {
    splitMessageOutput.textContent = "Add at least one loot item before splitting.";
    return;
  }

  // Edge case: missing or invalid party size.
  const partyResult = validatePartySize(partySizeInput.value.trim());

  if (!partyResult.isValid) {
    splitMessageOutput.textContent = partyResult.message;
    return;
  }

  const totalLoot = calculateTotal();
  const lootPerMember = totalLoot / partyResult.value;

  splitMessageOutput.textContent = "";
  finalTotalOutput.textContent = "Total Loot: " + formatCurrency(totalLoot);
  perMemberOutput.textContent =
    "Loot Per Party Member: " + formatCurrency(lootPerMember);
}

// Startup
// Register the listeners. After this the program is idle and only does work
// when one of the buttons is clicked.
addLootButton.addEventListener("click", addLoot);
splitLootButton.addEventListener("click", splitLoot);

// Render the initial empty state so the display areas are never blank.
renderLoot();
