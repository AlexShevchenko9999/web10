import stripe
import app.settings as settings 

stripe.api_key = settings.STRIPE_KEY

################
# Prices objects
################
subscription = [{
    "price":settings.STRIPE_CREDIT_SUB_ID,"quantity":1,'adjustable_quantity': {
        'enabled': True,}
    },
    {
    "price":settings.STRIPE_SPACE_SUB_ID,"quantity":1,"adjustable_quantity": {
        'enabled': True}
    }]
purchase = [{
    "price":settings.STRIPE_CREDIT_ID,"quantity":1,'adjustable_quantity': {
        'enabled': True,}
    }]


############################################
# customer payment / subscription management
############################################
def make_customer():
    customer = stripe.Customer.create(
        description="New Customer",
    )
    return customer["id"]

def get_active_subscription_data(customer_id):
    customer = stripe.Customer.retrieve(customer_id, expand=['subscriptions'])
    if "subscriptions" not in customer : return []
    subscriptions = customer["subscriptions"]
    return [sub["items"]["data"][0] for sub in subscriptions]


def sub_price_ids(sub_data):
    return [sub["price"]["id"] for sub in sub_data]

def create_checkout_session(customer_id,price_id,mode="subscription"):

    checkout_session = stripe.checkout.Session.create(
        success_url="http://auth.localhost",
        cancel_url="http://auth.localhost",
        customer=customer_id,
        payment_method_types=["card"],
        mode=mode,
        line_items= [{
    "price":price_id,"quantity":1,'adjustable_quantity': {
        'enabled': True,}
    }]
    )
    return checkout_session["url"]

def create_portal_session(customer_id):
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
    )
    return session["url"]

##############################
# button functions
##############################

# helper function for subscriptions
def manage_subscription(customer_id,price):
    prices = sub_price_ids(get_active_subscription_data(customer_id))
    if price in prices:
        return create_portal_session(customer_id)
    return create_checkout_session(customer_id,price,"subscription")

def manage_space(customer_id):
    return manage_subscription(customer_id,settings.STRIPE_SPACE_SUB_ID)

def manage_credits(customer_id):
    return manage_subscription(customer_id,settings.STRIPE_CREDIT_SUB_ID)

def purchase_credits(customer_id):
    return create_checkout_session(customer_id,settings.STRIPE_CREDIT_ID,"payment")

##################################
# payment registration functions
##################################

# gets amount of space in the customers space plan
def space(customer_id):
    sub_data = get_active_subscription_data(customer_id)
    prices = sub_price_ids(sub_data)
    idx = prices.find(settings.STRIPE_SPACE_ID)
    if idx == -1 : return settings.FREE_SPACE * 1024 * 1024
    return sub_data[idx]["price"]["quantity"] * 1024 * 1024 * 1024

# gets amount of credits in the customers credit plan
def credit(customer_id):
    sub_data = get_active_subscription_data(customer_id)
    prices = sub_price_ids(sub_data)
    idx = prices.find(settings.STRIPE_CREDIT_ID)
    if idx == -1 : return 0
    return sub_data[idx]["price"]["quantity"]
