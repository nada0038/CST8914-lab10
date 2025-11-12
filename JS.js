/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *   Description: Menu button that opens a menu of actions, made accessible for keyboard and mouse users.
 */

'use strict';

class MenuButtonActions {
  constructor(domNode, performMenuAction) {
    this.domNode = domNode;
    this.performMenuAction = performMenuAction;
    this.buttonNode = domNode.querySelector('button');
    this.menuNode = domNode.querySelector('[role="menu"]');
    this.menuitemNodes = [];
    this.firstMenuitem = false;
    this.lastMenuitem = false;
    this.firstChars = [];

    // Add event listeners for the menu button
    this.buttonNode.addEventListener('keydown', this.onButtonKeydown.bind(this));
    this.buttonNode.addEventListener('click', this.onButtonClick.bind(this));

    // Collect all menu items and prepare for focus management
    const nodes = domNode.querySelectorAll('[role="menuitem"]');

    for (let i = 0; i < nodes.length; i++) {
      const menuitem = nodes[i];
      this.menuitemNodes.push(menuitem);
      menuitem.tabIndex = -1; // make them unfocusable by default
      this.firstChars.push(menuitem.textContent.trim()[0].toLowerCase());

      // Listen for keyboard, mouse, and click interactions
      menuitem.addEventListener('keydown', this.onMenuitemKeydown.bind(this));
      menuitem.addEventListener('click', this.onMenuitemClick.bind(this));
      menuitem.addEventListener('mouseover', this.onMenuitemMouseover.bind(this));

      // Identify the first and last items for navigation
      if (!this.firstMenuitem) {
        this.firstMenuitem = menuitem;
      }
      this.lastMenuitem = menuitem;
    }

    // Add focus handling for style changes
    domNode.addEventListener('focusin', this.onFocusin.bind(this));
    domNode.addEventListener('focusout', this.onFocusout.bind(this));

    // Close the menu when clicking outside of it
    window.addEventListener('mousedown', this.onBackgroundMousedown.bind(this), true);
  }

  // Handle moving focus between menu items and maintain tabindex correctly
  setFocusToMenuitem(newMenuitem) {
    this.menuitemNodes.forEach(function (item) {
      if (item === newMenuitem) {
        item.tabIndex = 0; // make this item focusable
        newMenuitem.focus(); // move focus here
      } else {
        item.tabIndex = -1; // make others unfocusable
      }
    });
  }

  // Utility functions for directional focus
  setFocusToFirstMenuitem() { this.setFocusToMenuitem(this.firstMenuitem); }
  setFocusToLastMenuitem() { this.setFocusToMenuitem(this.lastMenuitem); }

  setFocusToPreviousMenuitem(currentMenuitem) {
    let newMenuitem;
    if (currentMenuitem === this.firstMenuitem) {
      newMenuitem = this.lastMenuitem;
    } else {
      const index = this.menuitemNodes.indexOf(currentMenuitem);
      newMenuitem = this.menuitemNodes[index - 1];
    }
    this.setFocusToMenuitem(newMenuitem);
  }

  setFocusToNextMenuitem(currentMenuitem) {
    let newMenuitem;
    if (currentMenuitem === this.lastMenuitem) {
      newMenuitem = this.firstMenuitem;
    } else {
      const index = this.menuitemNodes.indexOf(currentMenuitem);
      newMenuitem = this.menuitemNodes[index + 1];
    }
    this.setFocusToMenuitem(newMenuitem);
  }

  // Move focus by typing the first letter of a menu item
  setFocusByFirstCharacter(currentMenuitem, char) {
    char = char.toLowerCase();
    let start = this.menuitemNodes.indexOf(currentMenuitem) + 1;
    if (start >= this.menuitemNodes.length) start = 0;

    let index = this.firstChars.indexOf(char, start);
    if (index === -1) index = this.firstChars.indexOf(char, 0);

    if (index > -1) this.setFocusToMenuitem(this.menuitemNodes[index]);
  }

  // Show the menu and mark as expanded
  openPopup() {
    this.menuNode.style.display = 'block';
    this.buttonNode.setAttribute('aria-expanded', 'true');
  }

  // Hide the menu
  closePopup() {
    if (this.isOpen()) {
      this.buttonNode.removeAttribute('aria-expanded');
      this.menuNode.style.display = 'none';
    }
  }

  isOpen() {
    return this.buttonNode.getAttribute('aria-expanded') === 'true';
  }

  // Add or remove class for visual focus feedback
  onFocusin() { this.domNode.classList.add('focus'); }
  onFocusout() { this.domNode.classList.remove('focus'); }

  // Handle keyboard events on the button
  onButtonKeydown(event) {
    let flag = false;
    switch (event.key) {
      case ' ':
      case 'Enter':
      case 'ArrowDown':
        this.openPopup();
        this.setFocusToFirstMenuitem();
        flag = true;
        break;
      case 'ArrowUp':
        this.openPopup();
        this.setFocusToLastMenuitem();
        flag = true;
        break;
      case 'Escape':
        this.closePopup();
        flag = true;
        break;
    }
    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  // Handle mouse click on the button
  onButtonClick(event) {
    if (this.isOpen()) {
      this.closePopup();
      this.buttonNode.focus();
    } else {
      this.openPopup();
      this.setFocusToFirstMenuitem();
    }
    event.stopPropagation();
    event.preventDefault();
  }

  // Handle keyboard navigation inside the menu
  onMenuitemKeydown(event) {
    const tgt = event.currentTarget;
    let flag = false;
    const key = event.key;

    const isPrintableCharacter = (str) => str.length === 1 && /\S/.test(str);

    if (event.ctrlKey || event.altKey || event.metaKey) return;

    switch (key) {
      case ' ':
      case 'Enter':
        this.closePopup();
        this.performMenuAction(tgt);
        this.buttonNode.focus();
        flag = true;
        break;
      case 'Escape':
        this.closePopup();
        this.buttonNode.focus();
        flag = true;
        break;
      case 'ArrowUp':
        this.setFocusToPreviousMenuitem(tgt);
        flag = true;
        break;
      case 'ArrowDown':
        this.setFocusToNextMenuitem(tgt);
        flag = true;
        break;
      case 'Home':
        this.setFocusToFirstMenuitem();
        flag = true;
        break;
      case 'End':
        this.setFocusToLastMenuitem();
        flag = true;
        break;
      case 'Tab':
        this.closePopup();
        break;
      default:
        if (isPrintableCharacter(key)) {
          this.setFocusByFirstCharacter(tgt, key);
          flag = true;
        }
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  // Handle click selection on a menu item
  onMenuitemClick(event) {
    const tgt = event.currentTarget;
    this.closePopup();
    this.buttonNode.focus();
    this.performMenuAction(tgt);
  }

  // Handle mouse hover to keep tabindex synced with visual focus
  onMenuitemMouseover(event) {
    const tgt = event.currentTarget;
    this.setFocusToMenuitem(tgt); // ensures roving tabindex stays consistent
  }

  // Close menu when clicking anywhere outside of it
  onBackgroundMousedown(event) {
    if (!this.domNode.contains(event.target)) {
      if (this.isOpen()) {
        this.closePopup();
        this.buttonNode.focus();
      }
    }
  }
}

// Initialize all menu buttons on the page
window.addEventListener('load', function () {
  document.getElementById('action_output').value = 'none';

  function performMenuAction(node) {
    document.getElementById('action_output').value = node.textContent.trim();
  }

  const menuButtons = document.querySelectorAll('.menu-button-actions');
  for (let i = 0; i < menuButtons.length; i++) {
    new MenuButtonActions(menuButtons[i], performMenuAction);
  }
});
