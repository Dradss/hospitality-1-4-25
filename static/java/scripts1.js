document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("popup");
    const openTillAmount = document.getElementById("openTillAmount");
    const tillAmountDisplay = document.querySelector(".till-amount-display");
    const keypadButtons = document.querySelectorAll(".keypad button");
    const btnYes = document.getElementById("btnYes");
    const btnNo = document.getElementById("btnNo");

    let tillAmount = "";

    // Check if till has already been opened (check session variable)
    fetch('/check_till_status')  // Create an endpoint that returns the status of till
        .then(response => response.json())
        .then(data => {
            if (data.till_opened) {
                // If till is already opened, hide the popup and set the state
                openTillAmount.style.display = "none";
                popup.style.display = "none";
            }
        })
        .catch(error => console.error('Error:', error));

    // Handle Yes button in the popup
    btnYes.addEventListener("click", function () {
        popup.style.display = "none";
        openTillAmount.style.display = "block";
    });

    // Handle No button in the popup
    btnNo.addEventListener("click", function () {
        popup.style.display = "none";
    });

    // Handle keypad input
    keypadButtons.forEach(button => {
        button.addEventListener("click", function () {
            const value = this.textContent;
            if (value === "⌫") {
                tillAmount = tillAmount.slice(0, -1);
            } else {
                tillAmount += value;
            }
            tillAmountDisplay.value = tillAmount;
        });
    });

    function validateInput(value) {
        // Remove any non-digit characters and return only digits
        return value.replace(/[^0-9]/g, '');
    }

    // Handle keyboard input for the till amount display
    tillAmountDisplay.addEventListener("keydown", function (event) {
        // Allow only numeric keys and basic control keys
        if (event.key === "Backspace" || event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Tab" || event.key === "Enter") {
            return;
        }
        if (event.key < "0" || event.key > "9") {
            event.preventDefault();
        }
    });

    // Ensure input field only contains integer values
    tillAmountDisplay.addEventListener("input", function () {
        this.value = validateInput(this.value);
    });

    // Capture and send the current time in 12-hour format (AM/PM)
    function formatTimeTo12Hour(time) {
        let date = new Date(time);
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
    }

    document.querySelector('.btn-open-drawer').addEventListener('click', function () {
        const tillAmountInput = document.querySelector('.till-amount-display');
        const tillAmount = parseFloat(tillAmountInput.value);

        if (!tillAmount || tillAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const currentTime = new Date();
        const formattedTime = formatTimeTo12Hour(currentTime); // Format the time to AM/PM format

        // Send data to Flask API
        fetch('/open_till', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: tillAmount, time: formattedTime })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert('Till opened with amount: ₱' + data.amount);
                    document.getElementById('openTillAmount').style.display = 'none'; // Close the modal
                }
            })
            .catch(error => console.error('Error:', error));
    });
});


//menu.js
document.addEventListener('DOMContentLoaded', function () {
    const categories = document.querySelectorAll('.category'); // All category buttons
    const menuSections = document.querySelectorAll('.menu-items'); // All menu sections

    // Display all sections by default
    menuSections.forEach(section => {
        section.style.display = 'block';
    });

    const fetchAndDisplayCategoryItems = (category, containerId) => {
        fetch('/api/inventory_data')
            .then(response => response.json())
            .then(data => {
                // Clear any existing items
                const container = document.getElementById(containerId);
                container.innerHTML = '';

                // Filter items based on the category (uoi field)
                const filteredItems = data.filter(item => item.uoi === category);

                // Populate the container with filtered items
                filteredItems.forEach(item => {
                    const menuItem = document.createElement('div');
                    menuItem.classList.add('menu-item');
                    menuItem.setAttribute('data-category', category);

                    const imageUrl = `https://material-management-system-2.onrender.com${item.image_url}`;

                    menuItem.innerHTML = `
                        <img src="${imageUrl}" alt="${item.item}" onerror="this.src='/path/to/default-image.jpg'; console.log('Imahe hindi umiiral')">
                        <p>${item.item}</p>
                        <span>₱${item.price.toFixed(2)}</span>
                    `;

                    container.appendChild(menuItem);
                });
            })
            .catch(error => console.error(`Error fetching ${category} data:`, error));
    };

    // Fetch items for each category based on the uoi field from the API
    fetchAndDisplayCategoryItems('SOLO BOODLE FLIGHT', 'menu-grid-solo');
    fetchAndDisplayCategoryItems('BOODLE FLIGHTS', 'menu-grid-boodle');
    fetchAndDisplayCategoryItems('A LA CARTE', 'menu-grid-a-la-carte');
    fetchAndDisplayCategoryItems('SINGLE FLIGHTS', 'menu-grid-single-flights');
    fetchAndDisplayCategoryItems('INTERNATIONAL FLIGHTS', 'menu-grid-international-flights');
    fetchAndDisplayCategoryItems('UNCLE D\'S ICE CREAM SANDWICH', 'menu-grid-uncle');

    // Add category filtering functionality
    categories.forEach(category => {
        category.addEventListener('click', function () {
            const selectedCategory = this.getAttribute('data-category');

            // Remove 'active' class from all categories
            categories.forEach(cat => cat.classList.remove('active'));

            // Add 'active' class to the clicked category
            this.classList.add('active');

            if (selectedCategory === 'all') {
                // Show all menu sections
                menuSections.forEach(section => {
                    section.style.display = 'block';
                });
            } else {
                // Hide all menu sections
                menuSections.forEach(section => {
                    section.style.display = 'none';
                });

                // Show the selected category's menu items
                const activeSection = document.getElementById(selectedCategory);
                if (activeSection) {
                    activeSection.style.display = 'block';
                }
            }
        });
    });
});

//ORDERSUMMARY
document.addEventListener('DOMContentLoaded', function () {
    const emptyCart = document.getElementById('emptyCart');
    const orderOptions = document.getElementById('orderOptions');
    const orderSummary = document.getElementById('orderSummary');
    const totalAmountContainer = document.getElementById('totalAmountContainer');
    const totalAmountElement = document.getElementById('totalAmount'); // Element to display total amount
    const btnDineIn = document.querySelector('.btn-dine-in');
    const btnTakeOut = document.querySelector('.btn-take-out');

    let orderID = null; // To store the orderID for the session

    // Function to generate a unique order ID (for simplicity, using a timestamp)
    function generateOrderID() {
        return 'ORD' + Date.now();
    }

    // Function to get the current date in a readable format
    function getCurrentDate() {
        const date = new Date();
        return date.toDateString();
    }

    // Function to update the quantity
    function updateQuantity(button, increment) {
        const quantityElement = button.closest('.order-controls').querySelector('.quantity');
        let quantity = parseInt(quantityElement.textContent, 10);
        quantity = Math.max(1, quantity + increment); // Prevent quantity from going below 1
        quantityElement.textContent = quantity;

        calculateTotalAmount(); // Recalculate total after changing quantity
    }

    // Function to calculate the total amount of the order
    function calculateTotalAmount() {
        let totalAmount = 0;

        // Loop through all order items and calculate the total price
        const items = orderSummary.querySelectorAll('.item-container');
        items.forEach(item => {
            const priceElement = item.querySelector('.order-item-content span');
            const quantityElement = item.querySelector('.quantity');

            const price = parseFloat(priceElement.textContent.replace(/[^\d.-]/g, '')); // Extract number from price
            const quantity = parseInt(quantityElement.textContent, 10);

            totalAmount += price * quantity; // Add item total to the total amount
        });

        // Update the total amount display
        totalAmountElement.textContent = `₱${totalAmount.toFixed(2)}`;
    }

    // Function to delete an order item
    function deleteOrderItem(button) {
        const itemContainer = button.closest('.item-container');
        itemContainer.remove(); // Remove the selected item

        calculateTotalAmount(); // Recalculate the total after deletion

        // Check if the cart is now empty
        if (orderSummary.querySelectorAll('.item-container').length === 0) {
            // Clear order ID and date
            orderID = null;

            // Remove order ID and date container
            const orderContainer = orderSummary.querySelector('.order-container');
            if (orderContainer) {
                orderContainer.remove();
            }

            // Show the empty cart section
            emptyCart.style.display = 'block';

            // Hide the order options section
            orderOptions.style.display = 'none';
        }
    }

    // Event delegation for menu item image clicks (for all categories)
    document.querySelectorAll('.menu-grid').forEach(menuGrid => {
        menuGrid.addEventListener('click', function(event) {
            if (event.target.tagName === 'IMG') {
                const clickedImage = event.target;
                const menuItem = clickedImage.closest('.menu-item'); // Get the parent .menu-item element
                const itemName = menuItem.querySelector('p').textContent;
                const itemPrice = menuItem.querySelector('span').textContent;

                // Hide the empty cart section
                emptyCart.style.display = 'none';

                // Show the order options section
                orderOptions.style.display = 'block';

                // Generate the order ID only if it's null (i.e., first item clicked in this session)
                if (!orderID) {
                    orderID = generateOrderID();
                }

                // Get the current date
                const currentDate = getCurrentDate();

                // Create a new container for the image, name, price, and buttons
                const itemContainer = document.createElement('div');
                itemContainer.classList.add('item-container');

                // Create item details element
                const itemElement = document.createElement('div');
                itemElement.classList.add('order-item');
                itemElement.innerHTML = `
                    <img src="${clickedImage.src}" alt="${itemName}" class="order-summary-image">
                    <div class="order-item-content">
                        <p>${itemName}</p>
                        <span>${itemPrice}</span>
                    </div>
                `;

                const controlsElement = document.createElement('div');
                controlsElement.classList.add('order-controls');
                controlsElement.innerHTML = `
                    <div class="left-controls">
                        <button class="minus"><i class="fas fa-minus-circle"></i></button>
                    </div>
                    <div class="quantity-container">
                        <span class="quantity">1</span>
                    </div>
                    <div class="right-controls">
                        <button class="plus"><i class="fas fa-plus-circle"></i></button>
                    </div>
                    <div class="extra-controls">
                        <button class="edit"><i class="fas fa-pen"></i></button>
                        <button class="delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Append item details and controls to the item container
                itemContainer.appendChild(itemElement);
                itemContainer.appendChild(controlsElement);

                // If this is the first item, display the order ID and date only once
                if (orderSummary.childElementCount === 0) {
                    // Create the container for order ID and date
                    const orderContainer = document.createElement('div');
                    orderContainer.classList.add('order-container');

                    // Create order summary elements
                    const orderIDElement = document.createElement('div');
                    orderIDElement.innerHTML = `<p>Order ID</p><p>${orderID}</p>`;

                    const dateElement = document.createElement('div');
                    dateElement.innerHTML = `<p>Date</p><p>${currentDate}</p>`;

                    // Append order ID and date to the container
                    orderContainer.appendChild(orderIDElement);
                    orderContainer.appendChild(dateElement);

                    // Append the order ID and date container at the top of the summary
                    orderSummary.appendChild(orderContainer);
                }

                // Append the item to the order summary (without removing the existing ones)
                orderSummary.appendChild(itemContainer);
                calculateTotalAmount(); // Calculate total after adding an item
            }
        });
    });

    // Event listeners for minus and plus buttons
    orderSummary.addEventListener('click', function (event) {
        if (event.target.closest('.minus')) {
            updateQuantity(event.target.closest('.minus'), -1);
        } else if (event.target.closest('.plus')) {
            updateQuantity(event.target.closest('.plus'), 1);
        }
    });

    // Event listener for delete buttons
    orderSummary.addEventListener('click', function (event) {
        if (event.target.closest('.delete')) {
            deleteOrderItem(event.target.closest('.delete')); // Call delete function
        }
    });

    // Attach event listener to the "Dine In" and "Take Out" buttons
    if (btnDineIn) {
        btnDineIn.addEventListener('click', function() {
            totalAmountContainer.style.display = 'block';
        });
    }

    if (btnTakeOut) {
        btnTakeOut.addEventListener('click', function() {
            totalAmountContainer.style.display = 'block';
        });
    }
});


document.addEventListener("DOMContentLoaded", function() {
    // Get the required buttons and continue button
    const dineInButton = document.querySelector('.btn-dine-in');
    const takeOutButton = document.querySelector('.btn-take-out');
    const continueButton = document.getElementById("continueButton");

    // Function to collect order details
    function collectOrderDetails() {
        const orderDetails = {
            orderID: null,
            date: null,
            items: [],
            orderType: null,
            totalAmount: null,
        };

        // Get Order ID and Date
        const orderContainer = document.querySelector('.order-container');
        if (orderContainer) {
            orderDetails.orderID = orderContainer.querySelector('p:nth-child(2)').textContent;
            orderDetails.date = orderContainer.querySelector('div:nth-child(2) p:nth-child(2)').textContent;
        }

        // Get Menu Items and Quantities
        const items = document.querySelectorAll('.item-container');
        items.forEach(item => {
            const itemName = item.querySelector('.order-item-content p').textContent;
            const itemPrice = parseFloat(item.querySelector('.order-item-content span').textContent.replace(/[^\d.-]/g, ''));
            const itemQuantity = parseInt(item.querySelector('.quantity').textContent, 10);

            orderDetails.items.push({
                name: itemName,
                price: itemPrice,
                quantity: itemQuantity,
            });
        });

        // Get Order Type
        if (dineInButton.classList.contains('clicked')) {
            orderDetails.orderType = 'Dine In';
        } else if (takeOutButton.classList.contains('clicked')) {
            orderDetails.orderType = 'Take Out';
        }

        // Get Total Amount
        const totalAmountElement = document.getElementById('totalAmount');
        if (totalAmountElement) {
            orderDetails.totalAmount = parseFloat(totalAmountElement.textContent.replace(/[^\d.-]/g, ''));
        }

        return orderDetails;
    }

    if (dineInButton && takeOutButton && continueButton) {
        continueButton.addEventListener("click", async function() {
            const orderDetails = collectOrderDetails();

            try {
                const response = await fetch('/save_order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderDetails),
                });

                const result = await response.json();
                if (result.success) {
                    alert('Order saved successfully!');
                    if (orderDetails.orderType === 'Dine In') {
                        window.location.href = '/seats';
                    } else {
                        window.location.href = '/payment';
                    }
                } else {
                    alert('Failed to save the order: ' + result.error);
                }
            } catch (error) {
                console.error('Error saving order:', error);
                alert('An error occurred while saving the order.');
            }
        });

        // Toggle 'clicked' class for order type selection
        dineInButton.addEventListener('click', function() {
            takeOutButton.classList.remove('clicked');
            dineInButton.classList.toggle('clicked');
        });

        takeOutButton.addEventListener('click', function() {
            dineInButton.classList.remove('clicked');
            takeOutButton.classList.toggle('clicked');
        });
    } else {
        console.log("One or more required elements are missing.");
    }
});



  // Function to fetch cashier name and update the page
        async function loadCashierName() {
            try {
                const response = await fetch('/get_cashier_name');
                if (response.ok) {
                    const data = await response.json();
                    // Set the cashier name in the placeholder
                    const fullName = `${data.name} ${data.last_name}`;
                    document.getElementById('cashier-name').textContent = `Cashier: ${fullName}`;
                } else {
                    document.getElementById('cashier-name').textContent = 'Cashier: Not authenticated';
                }
            } catch (error) {
                console.error('Error fetching cashier name:', error);
                document.getElementById('cashier-name').textContent = 'Cashier: Error loading name';
            }
        }

        // Call the function when the page loads
        window.onload = loadCashierName;
