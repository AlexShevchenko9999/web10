//////////////////////
// global variables
//////////////////////
var contacts = [];
var contactIndex = -1;
var viewingType = "notes";

//////////////////////////
/// CRM Init. functions
//////////////////////////

//change view to logged in and initialize contacts
function crmInit() {
  auth.innerHTML = "Secure Log Out";
  loadContacts();
}

///////////////////////
//// WEB10 SETUP
///////////////////////

/* wapi initialization */
var wapi = wapiInit("https://auth.web10.app");

//check if logged in
if (wapi.isSignedIn()) init();

/* Web10 Login / Log out */
wapi.authListen(crmInit);

function Auth() {
  if (wapi.isSignedIn()) {
    wapi.signOut();
    setAuth(false);
    location.reload();
  } else {
    wapi.openAuthPortal();
  }
}

/* Web10 service change request */
/* requests access to the crm-contacts, crm-notes, and crm-ledges services */
/* doesn't allow inbound from others.*/
const sirs = [
  {
    body: {
      service: "crm-contacts",
      cross_origins: ["crm.localhost", "crm.web10.app", "crm.web10.dev"],
    },
  },
  {
    body: {
      service: "crm-notes",
      cross_origins: ["crm.localhost", "crm.web10.app", "crm.web10.dev"],
    },
  },
  {
    body: {
      service: "crm-ledges",
      cross_origins: ["crm.localhost", "crm.web10.app", "crm.web10.dev"],
    },
  },
];
wapi.SMROnReady(sirs, []);

/////////////////////////////////
///// Read Load Functions
/////////////////////////////////

function loadContacts() {
  wapi.read("crm-contacts").then(function (response) {
    contacts = response.data;
    displayContacts();
  });
}

function loadNotes(i) {
  const c = contacts[i];
  wapi.read("crm-notes", { id: c._id }).then(function (response) {
    modalBannerColor(c.color);
    document.getElementById(
      "myModalLabel"
    ).innerHTML = `${c.name}<a class = 'statusbutton' onclick='incrementColor(${i})'>&#9851;</a>`;
    contactIndex = i;
    displayNotes(response.data);
  });
}

function loadLedger(i) {
  const c = contacts[i];
  wapi.read("crm-ledges", { id: c._id }).then(function (response) {
    modalBannerColor(c.color);
    console.log(c.color);
    document.getElementById("ledgerlabel").innerHTML =
      `${c.name}<a class = 'statusbutton' onclick='incrementColor(${i})'> &#9851;</a>`;
    contactIndex = i;
    displayLedger(response.data);
  });
}

function loadModal() {
  document.getElementById("newnote").value = "";
  document.getElementById("ledgerform").reset();
  loadNotes(contactIndex);
  loadLedger(contactIndex);
}

//////////////////////////////
//// Add/Create functions
//////////////////////////////

function addContact() {
  var contact = {
    name: userName.value,
    company: userCompany.value,
    phone: userPhone.value,
    email: userEmail.value,
  };

  wapi.create("crm-contacts", contact).then(function (response) {
    contacts.push(response.data);
    displayContacts();
    userName.value = "";
    userCompany.value = "";
    userPhone.value = "";
    userEmail.value= "";
  });
}

function submitNote() {
  var note = document.getElementById("newnote").value;
  wapi
    .create("crm-notes", { note: note, id: contacts[contactIndex]._id, date: new Date()})
    .then(loadCurrent);
}

function submitLedger() {
  var form = {};
  $("#ledgerform")
    .serializeArray()
    .map(function (x) {
      form[x.name] = x.value;
    });
  form.id = contacts[contactIndex]._id;
  form.date = new Date();
  wapi.create("crm-ledges", form).then(loadCurrent);
}

////////////////////////////
///// Update functions
////////////////////////////

//rotates the color of a contact
function incrementColor(i) {
  const c = contacts[i];
  var new_color =
    c.color == "green"
      ? "red"
      : c.color == "red"
      ? "yellow"
      : c.color == "yellow"
      ? "green"
      : "NULL";
  const [query, values] = [
    { _id: contact._id },
    { $set: { color: new_color } },
  ];
  wapi.update("crm-contacts", query, values).then(function () {
    c.color = new_color;
    modalBannerColor(new_color);
    displayContacts();
  });
}

/////////////////////////////
//// Deletion function
/////////////////////////////

function deleteContact(id) {
  var i = 0;
  for (var i = 0; i < contacts.length; i++) {
    if (contacts[i]._id == id) {
      wapi.delete("crm-contacts", contacts[i]).then(function(){
        contacts.splice(i, 1);
        displayContacts();
      });
    }
  }
}

////////////////////////////////////////
////////// validation functions
///////////////////////////////////////

function validateName() {
  var regex = /^[a-zA-Z0-9]+([a-zA-Z0-9](_|-| )[a-zA-Z0-9])*[a-zA-Z0-9]+$/;
  if (regex.test(userNameInp.value) == true) {
    document.getElementById("nameAlert").style.display = "none";
    return true;
  } else {
    document.getElementById("nameAlert").style.display = "block";
    return false;
  }
}

function validatePhone() {
  var regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  if (regex.test(userPhoneInp.value) == true) {
    document.getElementById("phoneAlert").style.display = "none";
    return true;
  } else {
    document.getElementById("phoneAlert").style.display = "block";
    return false;
  }
}

function validateEmail() {
  var regex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (regex.test(userEmailInp.value) == true) {
    document.getElementById("mailAlert").style.display = "none";
    return true;
  } else {
    document.getElementById("mailAlert").style.display = "block";
    return false;
  }
}

////////////////////////////////////
////// Display Functions
////////////////////////////////////

function displayModalBannerColor(color) {
  modalbanner.className = `modal-header ${color}`;
}

function toggleNoteLedge() {
  var button = document.getElementById("statusbutton");
  if (button.innerHTML == "Viewing Ledger") {
    button.innerHTML = "Viewing Notes";
    viewingType = "notes";
  } else {
    button.innerHTML = "Viewing Ledger";
    viewingType = "ledger";
  }
  displayContacts();
}

function displayContacts() {
  var temp = ``;
  for (var i = 0; i < contacts.length; i++) {
    const c = contacts[i];

    // make the mail link
    const mailLink = function () {
      const m = c.email;
      const max = 25;
      const short_m = m && m.length > max ? `${m.slice(0, max_len)}...` : m;
      return m ? `<a href = "mailto:${m}" title = "${m}">${short_m}</a>` : "-";
    };

    // name link that toggles the modal data viewer
    var name = c.name ? c.name : "-";
    var nameLink = `<a href="#" data-toggle="modal" data-target="#${viewingType}" 
      onclick="contactIndex=${i};loadModal()">${name}</a>`;

    // contact deletion link
    const deleteLink = `<a onclick="deleteContact(${c._id})" class="text-danger"><i class="fas fa-minus-circle"></i></a>`;

    temp += `<tr class="${c.color}">
    <td>${nameLink}</td>
    <td>${c.company ? c.company : "-"}</td>
    <td>${c.phone ? c.phone : "-"}</td>
    <td>${mailLink()}</td>
    <td>${deleteLink}</td></tr>`;
  }
  document.getElementById("tableBody").innerHTML = temp;
  searchFunction();
}

function displayNotes(notes) {
  var log = "";

  for (var z = 0; z < notes.length; z++) {
    var note = notes[z].note;
    var date = notes[z].date;

    log += "<b>" + date + "</b><p>" + note + "</p>";
  }

  document.getElementById("note_log").innerHTML = log;
}

function displayLedger(entries) {
  console.log(entries);
  var log = "";
  for (var z = 0; z < entries.length; z++) {
    var description = entries[z].description;
    var date = entries[z].date;
    var amount = entries[z].amount;
    var recurring = entries[z].recurring;
    var check_number = entries[z].check_number;

    log +=
      "<div class = 'ledge'>" +
      "<p><b>" +
      date +
      "</b></p><p>" +
      "Recurring? : " +
      recurring +
      "</p><p>" +
      "Check Num. : " +
      check_number +
      "</p><p>" +
      "Amount ($) : " +
      amount +
      "</p><p>" +
      "Description: " +
      description +
      "</p>" +
      "</div > ";
  }

  document.getElementById("ledger_log").innerHTML = log;
}

//////////////////////////////////////////
/////// Filter and Search Functions
/////////////////////////////////////////

//step at the beginning of the search function always.
function colorFilter() {
  var green = document.getElementById("green");
  var yellow = document.getElementById("yellow");
  var red = document.getElementById("red");
  var table = document.getElementById("myTable");
  var tr = table.getElementsByTagName("tr");
  for (var i = 0; i < tr.length; i++) {
    var row = tr[i];
    var rowclass = row.getAttribute("class");

    if (!red.checked && rowclass == "red") {
      row.style.display = "none";
    } else if (!yellow.checked && rowclass == "yellow") {
      row.style.display = "none";
    } else if (!green.checked && rowclass == "green") {
      row.style.display = "none";
    } else {
      row.style.display = "";
    }
  }
}

// filters displayed contacts by what is in the search field
function searchFunction() {
  var input, filter, table, tr, i, currname, currcomp, currphone, curremail;
  //first do color filtering
  statusFilter();
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");
  for (i = 0; i < tr.length; i++) {
    currname = tr[i].getElementsByTagName("td")[0];
    currcomp = tr[i].getElementsByTagName("td")[1];

    //TODO
    currphone = tr[i].getElementsByTagName("td")[2];
    curremail = tr[i].getElementsByTagName("td")[3];

    if (currname && currcomp) {
      currname = currname.textContent || currname.innerText;
      currcomp = currcomp.textContent || currcomp.innerText;
      if (currname.toUpperCase().indexOf(filter) > -1) {
        continue;
      } else if (currcomp.toUpperCase().indexOf(filter) > -1) {
        continue;
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}
