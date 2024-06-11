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

// Function to show the compose email view
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

// Function to load the specified mailbox
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view_email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get emails for the specified mailbox
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

      // Change background color if email is read
      if (newEmail.read) {
        newEmails.classList.add('list-group-item-secondary')
      };

      // Add click event to view email
      newEmails.addEventListener('click', () => view_email(newEmail.id, mailbox));
      document.querySelector('#emails-view').append(newEmails);
    })
  });
}

// Function to view a specific email
function view_email(id, mailbox) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

      // Show the clicked email and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#view_email').style.display = 'block';

      // Hide archive button HTML from sent mailbox
      let archiveButtonHTML = '';
      if (mailbox !== 'sent') {
        archiveButtonHTML = `<button class="btn btn-sm" id="archive"></button>`
      };

      // Display the email details
      document.querySelector('#view_email').innerHTML = `
      <p class="mb-0"><strong>From:</strong> ${email.sender}</p>
      <p class="mb-0"><strong>To:</strong> ${email.recipients}</p>
      <p class="mb-0"><strong>Subject:</strong> ${email.subject}</p>
      <p class="mb-0"><strong>Timesatamp:</strong> ${email.timestamp}</p>
      ${archiveButtonHTML}
      <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
      <hr>
      <p>${email.body}</p>
      `;

      // Mark email as read
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });

      // Add functionality to archive button
      if (mailbox !== 'sent') {
        const archiveButton = document.querySelector('#archive');

        archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
        archiveButton.classList.add(email.archived ? 'btn-outline-success' : 'btn-outline-danger');

        // Archive/unarchive the email on button click
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

      // Add functionality to reply button
      document.querySelector('#reply').addEventListener('click', () => {
        console.log('replied')
        compose_email()

        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
        document.querySelector('#compose-body').value = `"On ${email.timestamp}, ${email.sender} wrote: ${email.body}"\n\n`;

        // Form submit handler
        document.querySelector('#compose-form').addEventListener('submit', send_email)
      });

  });
}

// Function to send an email
function send_email(event) {
  event.preventDefault();

  // Get form values
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send email via POST request
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