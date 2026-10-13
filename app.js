
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8CNlvpGno8-jr-LmtWYPZ5q5K7qG9Lic",
  authDomain: "fir-authentication-74672.firebaseapp.com",
  projectId: "fir-authentication-74672",
  storageBucket: "fir-authentication-74672.firebasestorage.app",
  messagingSenderId: "1056559486516",
  appId: "1:1056559486516:web:80ab1e5966356bdb165c61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsRef = collection(db, "products");

let products = [];
let editId = null;

const productGrid = document.getElementById("productGrid");
const adminProductList = document.getElementById("adminProductList");
const productForm = document.getElementById("productForm");

const nameInput = document.getElementById("productName");
const priceInput = document.getElementById("productPrice");
const linkInput = document.getElementById("productLink");
const ratingInput = document.getElementById("productRating");

// Dark or Light Mode
const themeBtn = document.getElementById("themeBtn");

function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeBtn.textContent = dark ? "☀ Light mode" : "☾ Dark mode";
  localStorage.setItem("novaTheme", dark ? "dark" : "light");
}

if (themeBtn) {
  setTheme(localStorage.getItem("novaTheme") === "dark");

  themeBtn.addEventListener("click", function () {
    setTheme(!document.body.classList.contains("dark"));
  });
}

// Message show karna ha
function showMessage(message, type) {
  const formMessage = document.getElementById("formMessage");

  if (formMessage) {
    formMessage.textContent = message;
    formMessage.className = "form-message " + type;
  }
}

// Product link safe ho raha ha check karte ha 
function validProductUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function showDashboardProducts() {
  if (!productGrid) return;

  document.getElementById("totalProducts").textContent = products.length;

  let totalRating = 0;

  for (let i = 0; i < products.length; i++) {
    totalRating += Number(products[i].rating) || 0;
  }

  let average = products.length
    ? (totalRating / products.length).toFixed(1)
    : "0.0";

  document.getElementById("averageRating").innerHTML =
    average + ' <span class="star">★</span>';

  if (products.length === 0) {
    productGrid.innerHTML =
      '<div class="empty-state">No products yet. Open Admin Panel to add your first product.</div>';
    return;
  }

  productGrid.innerHTML = "";

  for (let i = 0; i < products.length && i < 4; i++) {
    let product = products[i];

    let card = document.createElement("article");
    card.className = "product-card";

    let imageBox = document.createElement("div");
    imageBox.className = "product-image";

    let image = document.createElement("img");
    image.src = product.link;
    image.alt = product.name;
    image.loading = "lazy";

    image.onerror = function () {
      image.style.display = "none";
      imageBox.textContent = "Image unavailable";
    };

    imageBox.appendChild(image);

    let info = document.createElement("div");
    info.className = "product-info";

    let title = document.createElement("h3");
    title.textContent = product.name;

    let meta = document.createElement("div");
    meta.className = "product-meta";

    let price = document.createElement("span");
    price.className = "price";
    price.textContent = "$" + Number(product.price).toFixed(2);

    let rating = document.createElement("span");
    rating.className = "rating";
    rating.textContent = "★ " + Number(product.rating).toFixed(1);

    meta.append(price, rating);

    let openButton = document.createElement("a");
    openButton.className = "btn btn-primary";
    openButton.href = product.link;
    openButton.target = "_blank";
    openButton.rel = "noopener noreferrer";
    openButton.textContent = "View Product ↗";

    info.append(title, meta, openButton);
    card.append(imageBox, info);
    productGrid.appendChild(card);
  }
}

// Admin panel par tamam products
function showAdminProducts() {
  if (!adminProductList) return;

  document.getElementById("adminCount").textContent =
    products.length + (products.length === 1 ? " item" : " items");

  adminProductList.innerHTML = "";

  if (products.length === 0) {
    adminProductList.innerHTML =
      '<tr><td colspan="4">No products found. Add your first product.</td></tr>';
    return;
  }

  for (let i = 0; i < products.length; i++) {
    let product = products[i];

    let tr = document.createElement("tr");

    let productCell = document.createElement("td");
    let productBox = document.createElement("div");
    productBox.className = "table-product";

    let image = document.createElement("img");
    image.src = product.link;
    image.alt = product.name;

    image.onerror = function () {
      image.style.display = "none";
    };

    let name = document.createElement("span");
    name.textContent = product.name;

    productBox.append(image, name);
    productCell.appendChild(productBox);

    let priceCell = document.createElement("td");
    priceCell.textContent = "$" + Number(product.price).toFixed(2);

    let ratingCell = document.createElement("td");
    ratingCell.textContent = "★ " + Number(product.rating).toFixed(1);

    let actionsCell = document.createElement("td");
    let actions = document.createElement("div");
    actions.className = "action-buttons";

    let editButton = document.createElement("button");
    editButton.className = "btn-small btn-edit";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {
      editProduct(product.id);
    });

    let deleteButton = document.createElement("button");
    deleteButton.className = "btn-small btn-delete";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
      deleteProduct(product.id);
    });

    actions.append(editButton, deleteButton);
    actionsCell.appendChild(actions);

    tr.append(productCell, priceCell, ratingCell, actionsCell);
    adminProductList.appendChild(tr);
  }
}

// Firestore se live data
onSnapshot(
  productsRef,
  function (snapshot) {
    products = [];

    snapshot.forEach(function (item) {
      products.push({
        id: item.id,
        ...item.data()
      });
    });

    showDashboardProducts();
    showAdminProducts();
  },
  function (error) {
    console.error("Firestore error:", error);

    if (productGrid) {
      productGrid.textContent =
        "Could not load products. Check Firebase configuration and Firestore rules.";
    }

    if (adminProductList) {
      adminProductList.innerHTML =
        '<tr><td colspan="4">Could not load products. Check Firebase setup.</td></tr>';
    }
  }
);

// Add or Update product
if (productForm) {
  productForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    let name = nameInput.value.trim();
    let price = Number(priceInput.value);
    let rating = Number(ratingInput.value);
    let link = linkInput.value.trim();

    if (!name || !link || !validProductUrl(link)) {
      showMessage("Enter a valid product name and HTTP/HTTPS URL.", "error");
      return;
    }

    if (
      priceInput.value.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      ratingInput.value.trim() === "" ||
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5
    ) {
      showMessage("Enter a valid price and rating between 0 and 5.", "error");
      return;
    }

    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      let productData = {
        name: name,
        price: price,
        link: link,
        rating: rating
      };

      if (editId) {
        await updateDoc(doc(db, "products", editId), productData);
        showMessage("Product updated successfully!", "success");
      } else {
        await addDoc(productsRef, productData);
        showMessage("Product added successfully!", "success");
      }

      resetForm();
    } catch (error) {
      console.error(error);
      showMessage(
        "Could not save product. Check Firestore permissions.",
        "error"
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = editId ? "Update Product" : "＋ Add Product";
    }
  });
}

// Edit product complete
function editProduct(id) {
  let product = products.find(function (item) {
    return item.id === id;
  });

  if (!product) return;

  editId = id;

  nameInput.value = product.name;
  priceInput.value = product.price;
  linkInput.value = product.link;
  ratingInput.value = product.rating;

  document.getElementById("formTitle").textContent = "Edit Product";
  document.getElementById("saveBtn").textContent = "Update Product";
  document.getElementById("cancelEdit").classList.remove("hidden");

  showMessage("Editing: " + product.name, "success");

  document.getElementById("productForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Delete product complete
async function deleteProduct(id) {
  let confirmDelete = confirm("Are you sure you want to delete this product?");

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "products", id));

    if (editId === id) {
      resetForm();
    }

    showMessage("Product deleted successfully!", "success");
  } catch (error) {
    console.error(error);
    showMessage("Could not delete product. Check permissions.", "error");
  }
}

// Form reset complete
function resetForm() {
  editId = null;

  productForm.reset();

  document.getElementById("formTitle").textContent = "Add New Product";
  document.getElementById("saveBtn").textContent = "＋ Add Product";
  document.getElementById("cancelEdit").classList.add("hidden");
}

if (document.getElementById("cancelEdit")) {
  document.getElementById("cancelEdit").addEventListener("click", resetForm);
}
//Dashboard task has been completed by Armaan.