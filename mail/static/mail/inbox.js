document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Form submit handler
  document.querySelector('#compose-form').addEventListener('submit', send_email)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view_email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view_email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get mailbox from user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(email => {

    // Display the email
    email.forEach(newEmail => {
      const newEmails = document.createElement('div');
      newEmails.className = 'list-group-item d-flex justify-content-between align-items-center mb-2'
      newEmails.innerHTML = `
      <h6>${newEmail.sender}</h6>
      <h6>${newEmail.subject}</h6>
      <p class="text-muted">${newEmail.timestamp}</p>`;

      // Change background color
      if (newEmail.read) {
        newEmails.classList.add('list-group-item-secondary')
      };

      newEmails.addEventListener('click', () => view_email(newEmail.id, mailbox));
      document.querySelector('#emails-view').append(newEmails);
    })
  });
}

function view_email(id, mailbox) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email);

      // Show the clicked email and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#view_email').style.display = 'block';

      let archiveButtonHTML = '';
      if (mailbox !== 'sent') {
        archiveButtonHTML = `<button class="btn btn-sm" id="archive"></button>`
      };

      document.querySelector('#view_email').innerHTML = `
      <p class="mb-0"><strong>From:</strong> ${email.sender}</p>
      <p class="mb-0"><strong>To:</strong> ${email.recipients}</p>
      <p class="mb-0"><strong>Subject:</strong> ${email.subject}</p>
      <p class="mb-0"><strong>Timesatamp:</strong> ${email.timestamp}</p>
      ${archiveButtonHTML}
      <button class="btn btn-sm" id="reply">Reply</button>
      <hr>
      <p>${email.body}</p>
      `;

      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });

      if (mailbox !== 'sent') {
        const archiveButton = document.querySelector('#archive');

        archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
        archiveButton.classList.add(email.archived ? 'btn-outline-success' : 'btn-outline-danger');

        archiveButton.addEventListener('click', () => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
          })
          .then(() => {
            load_mailbox('inbox')
          })
        });
      };

  });
}

// Send email to a receipent
function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_mailbox('sent');
  });
}