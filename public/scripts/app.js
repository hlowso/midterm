// TODO deal with double-clicking on items being added to cart

const renderMenu = (menu) => {
  let current_category   = menu[0].category;
  let $category          = $(`<div class="${current_category}"></div>`);
  const $menu            = $('#menu');
  $menu.empty();

  for(let product of menu) {
    if(current_category != product.category) {
      $menu.append($category);
      current_category = product.category;
      $category = $(`<div class="${current_category}"></div>`);
    }
    $product = $(`
      <div class="product">
        <span>${product.name}</span>
        <small>$${product.price}</small>
      </div>
    `);
    $product.data('product_json', JSON.stringify(product));
    $category.append($product);
  }

  $menu.append($category);
  $('.product').on('click', displayQuantityForm);

};

const renderCart = (cart) => {
  const $cart = $('#cart');
  const printHTML = (cart) => {
    let total = 0;
    for(let product_id in cart) {
      let qty          = cart[product_id].qty;
      let product      = JSON.parse(cart[product_id].json);
      let price_sum    = product.price * qty;
      total += price_sum;

      let $product = $(`
        <div class="cart_item" data-id="${product_id}">
          <small>${qty}</small>
          <span>${product.name}</span>
          <small>$${price_sum}</small>
        </div>
      `);

      $cart.append($product);
    }

    $cart.append(`<span>Total $${total}</span>`);
    $cart.append('<button id="order">Place Order</button>');

    $('.cart_item').on('click', removeThisFromCart);
    $('#order').on('click', placeOrder);
  };

  $cart.empty();
  $cart.append('<h3>Your Cart:</h3>');

  if($.isEmptyObject(cart)) {
    const returning_cart = $cart.data('json');
    if(!$.isEmptyObject(returning_cart)) {
      printHTML(returning_cart);
    }
    else {
      $cart.append('<p>Your cart is empty. Click on the menu items to add to your cart.');      
    }
  }
  else {
    printHTML(cart);
  }
};

function placeOrder() {
  if(!$('nav').data('logged_in')) {
    displayLoginFormAsync()
    .then((user_logged_in) => {
      if(user_logged_in) {
        alert('now we will place your order');
      }
    })
    .catch((message) => {
      alert(message);
    });
  }
  else {
    // TODO write this function. Talk to Greg about Twilio
    alert('This is where we do the twilio call and access the database to create an order row in the orders table');
  }
}

function removeThisFromCart() {
  $.ajax({
    method: "DELETE",
    url: `/cart/${$(this).data('id')}`,
  })
  .done((cart) => {
    renderCart(JSON.parse(cart));
  });
}

function addToCart(product_json, qty) {
  $.ajax({
    method: "POST",
    url: `/cart/${JSON.parse(product_json).id}`,
    data: {
      json: product_json,
      qty: qty
    }
  })
  .done((cart) => {
    renderCart(JSON.parse(cart));
  });
}

function displayQuantityForm() {
  const $quantity_form   = $('#specify_quantity');
  const $qty             = $quantity_form.find('span');
  const $plus            = $quantity_form.find('.plus');
  const $minus           = $quantity_form.find('.minus');
  const $add             = $quantity_form.find('.add');
  const $cancel          = $quantity_form.find('.cancel');
  const product_json     = $(this).data('product_json');
  const exit             = () => {
    $plus.off('click');
    $minus.off('click');
    $add.off('click');
    $cancel.off('click');
    $quantity_form.fadeOut();
  };

  $qty.text(1);

  $plus.on('click', function() {
    let new_qty = Number($qty.text()) + 1;
    $qty.text(new_qty);
  });

  $minus.on('click', function() {
    let new_qty = Number($qty.text()) - 1;
    if(new_qty > 0) {
      $qty.text(new_qty);
    }
  });

  $add.on('click', function() {
    exit();
    addToCart(product_json, Number($qty.text()));
  });

  $cancel.on('click', function() {
    exit();
  });

  $quantity_form.fadeIn();

}

function reflectLoginStatus() {
  const logged_in = $('nav').data('logged_in');
  if(logged_in) {
    $('#login_button').hide();
    $('nav').find('#logout_button').closest('div').show();

    $('#logout_button').on('click', function() {
      $.ajax({
        method: "PUT",
        url: "/users/logout"
      })
      .done(() => window.location.replace("/"));
    });
  }
  else {
    $('#login_button').show();
    $('nav').find('#logout_button').closest('div').hide();

    $('#login_button').on('click', function(event) {
      event.stopImmediatePropagation();
      displayLoginFormAsync()
        .then((user_logged_in) => {
          if(user_logged_in) {
            reflectLoginStatus();
          }
        })
        .catch((message) => {
          // TODO you can do better than alert...
          alert(message);
        });

    });
    $('#view_orders').on('click', function(event) {
      displayLoginFormAsync()
        .then((user_logged_in) => {
          if(user_logged_in) {
            window.location.replace("/orders");
          }
        })
        .catch((message) => {
          alert(message);
        });
    });
  }
}

function displayLoginFormAsync() {
  return new Promise(function(resolve, reject) {
    const $login_section    = $('#login');
    const $form             = $login_section.find('form');
    const exit              = () => {
      $form.off('submit');
      $login_section.fadeOut();
    };

    $form.on('submit', function(event) {
      event.preventDefault();
      $.ajax({
        method: "PUT",
        url: "/users/login",
        data: $form.serialize()
      })
      .done((username) => {
        exit();
        
        $('#username')
        .data('username', username)
        .text(username);

        $('nav').data('logged_in', true);
        resolve(true);
      })
      .fail(() => {
        exit();
        reject('there was a problem logging in');
      });
    });
    $login_section.on('click', (event) => {
      event.stopPropagation();
    });
    $(document).on('click', function() {
      resolve(false);
      exit();
    }); 
    $login_section.fadeIn();
  });
}

$(() => {

  $.ajax({
    method: "GET",
    url: "/menu"
  })
  .done((menu) => {
    renderMenu(menu);
    renderCart();
    reflectLoginStatus();
  });

});
