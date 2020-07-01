import sha256 from 'crypto-js/sha256';
import encHex from 'crypto-js/enc-hex.js';
import encBase64 from 'crypto-js/enc-base64.js';
import encLatin1 from 'crypto-js/enc-latin1.js';
import encUtf8 from 'crypto-js/enc-utf8.js';
import encUtf16 from 'crypto-js/enc-utf16.js';
import aes from 'crypto-js/aes.js';
import ecb from 'crypto-js/mode-ecb';
import pkcs7 from 'crypto-js/pad-pkcs7';
import 'bootstrap';
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import './scss/app.scss';

function getSelectedValue(id) {
  return getSelectedOption(id).value;
}

function getSelectedOption(id) {
  const select = document.getElementById(id);
  return select.options[select.selectedIndex];
}

function deriveKey(kdf, password) {
  switch(kdf) {
    case 'sha256':
      return sha256(password);
    default:
      return "invalid-kdf";
  }
}

function togglePasswordHidden(event) {
  event.preventDefault();
  const toggle = document.getElementById("password-toggle-ico");
  const password = document.getElementById("password");
  console.log(password.getAttribute("type"));
  if(password.getAttribute("type") === "text"){
    password.setAttribute('type', 'password');
    toggle.classList.remove( "fa-eye" );
    toggle.classList.add( "fa-eye-slash" );
  }else if(password.getAttribute("type") === "password"){
    password.setAttribute('type', 'text');
    toggle.classList.remove( "fa-eye-slash" );
    toggle.classList.add( "fa-eye" );
  }
}

function getEncoder(type) {
  switch(type) {
    case 'hex':
      return encHex;
    case 'base64':
      return encBase64;
    case 'latin1':
      return encLatin1;
    case 'utf8':
      return encUtf8;
    case 'utf16':
      return encUtf16;
    default:
      return null;
  }
}

class TypeableText {
  constructor(idPrefix) {
    this.idPrefix = idPrefix;
    this.wordArray = null;
    this.setterFromWordArray = false;
    this.currentType = null;
  }

  resetStorage() {
    if (!this.setterFromWordArray) {
      this.wordArray = null;
    }
  }

  updateDisplay(typeChanged = false) {
    this.setterFromWordArray = true;
    try {
      document.getElementById(this.idPrefix + 'value').value =
        getEncoder(getSelectedValue(this.idPrefix + 'type')).stringify(this.getWordArray());
    } catch (error) {
      if (!typeChanged && this.currentType !== 'hex') {
        //current type is invalid => try again with hex
        this.currentType = 'hex';
        document.getElementById(this.idPrefix + 'type').value = 'hex';
        this.updateDisplay();
      } else {
        throw error;
      }
    }
    this.setterFromWordArray = false;
  }

  updateWordArray() {
    if (this.wordArray == null) {
      this.wordArray = getEncoder(this.currentType).parse(document.getElementById(this.idPrefix + 'value').value);
    }
  }

  getWordArray() {
    this.updateWordArray();
    return this.wordArray;
  }

  changeType() {
    try {
      this.updateDisplay(true);
    } catch {
      document.getElementById(this.idPrefix + 'type').value = this.currentType;
      return;
    }
    this.currentType = getSelectedValue(this.idPrefix + 'type');
  }
}

let key = new TypeableText('key-');
let encrypted = new TypeableText('encrypted-');
let decrypted = new TypeableText('decrypted-');

document.addEventListener("DOMContentLoaded",function() {
  key.currentType = getSelectedValue('key-type');
  document.getElementById('key-value').value = '';
  encrypted.currentType = getSelectedValue('encrypted-type');
  document.getElementById('encrypted-value').value = '';
  decrypted.currentType = getSelectedValue('decrypted-type');
  document.getElementById('decrypted-value').value = '';

  document.getElementById("password-toggle-link").addEventListener("click", togglePasswordHidden);
});

window.generateKey = function() {
  key.wordArray = deriveKey(getSelectedValue("kdf"), sha256(document.getElementById("password").value));
  key.updateDisplay();
}

window.keyChanged = function() {
  key.resetStorage();
}

window.keyTypeChanged = function() {
  key.changeType();
}

window.encryptedTypeChanged = function() {
  encrypted.changeType();
}

window.encryptedChanged = function() {
  encrypted.resetStorage();
}

window.decryptedTypeChanged = function() {
  decrypted.changeType();
}

window.decryptedChanged = function() {
  decrypted.resetStorage();
}

function mode() {
  switch(getSelectedOption('cipher-mode')) {
    case 'ecb':
      return ecb;
    default:
      return ecb;
  }
}

function padding() {
  switch(getSelectedOption('padding')) {
    case 'pkcs7':
      return pkcs7;
    default:
      return pkcs7;
  }
}

function method() {
  switch(getSelectedOption('method')) {
    case 'aes':
      return aes;
    default:
      return aes;
  }
}

function params() {
  return {
    mode: mode() ,
    padding: padding()
  };
}

window.encrypt = function() {
  if (key.wordArray == null) {
    return;
  }

  const base64encrypted = method().encrypt(decrypted.getWordArray(), key.getWordArray(), params()).toString();
  encrypted.wordArray = encBase64.parse(base64encrypted);

  encrypted.updateDisplay();
}

window.decrypt = function() {
  if (key.wordArray == null) {
    return;
  }

  decrypted.wordArray = method().decrypt(encrypted.getWordArray().toString(encBase64), key.getWordArray(), params());

  decrypted.updateDisplay();
}
