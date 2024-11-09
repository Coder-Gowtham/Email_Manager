require('dotenv').config();
const { simpleParser } = require('mailparser');
const { format } = require('date-fns');
const Imap = require('imap');
const { htmlToText } = require('html-to-text');

const fetchEmailsOutlook = (imapConfig, batchSize = 100, fetchAll = false) => {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);
        let parsedEmails = [];

        const folders = ['Inbox', 'Sent', 'Drafts', 'Outbox', 'Junk', 'Deleted', 'Archive', 'Notes'];
        const imapFolders = [];

        imap.once('ready', async () => {
            console.log('IMAP connection ready');

            // Fetch the folders in the mailbox
            imap.getBoxes((err, boxes) => {
                if (err) {
                    console.error('Error fetching folders:', err);
                    return reject(err);
                }
                for (const folderName in boxes) {
                    imapFolders.push(folderName);
                }
                console.log('Fetched folders:', imapFolders); // Array of folder names
            });

            const fetchFromFolder = (folderName) => {
                return new Promise((fetchEmailResolve, fetchEmailReject) => {
                    imap.openBox(folderName, true, (err, box) => {
                        if (err) {
                            console.error(`Error opening ${folderName}:`, err);
                            return fetchEmailReject(err);
                        }

                        imap.search(['ALL'], (err, results) => {
                            if (err) {
                                return fetchEmailReject(err);
                            }

                            if (results.length === 0) {
                                console.log(`No emails found in ${folderName}, moving to next folder.`);
                                return fetchEmailResolve();
                            }

                            const emailIdsToFetch = fetchAll ? results : results.slice(-batchSize);
                            const fetch = imap.fetch(emailIdsToFetch, { bodies: '' });

                            fetch.on('message', (msg) => {
                                let emailBuffer = '';
                                let emailData = {
                                    folderName: folderName,
                                    flags: [],
                                    uid: null,
                                    bodystructure: null
                                };

                                msg.on('attributes', (attrs) => {
                                    emailData.flags = attrs.flags;
                                    emailData.uid = attrs.uid;
                                    emailData.bodystructure = attrs.struct;
                                });

                                msg.on('body', (stream) => {
                                    stream.on('data', (chunk) => {
                                        emailBuffer += chunk.toString('utf8');
                                    });

                                    stream.on('end', async () => {
                                        try {
                                            const parsed = await simpleParser(emailBuffer);

                                            // Check if the date is valid before using it
                                            if (!parsed.date || isNaN(new Date(parsed.date).getTime())) {
                                                console.warn(`Skipping email with invalid date: ${parsed.messageId}`);
                                                return; // Skip this email if date is invalid
                                            }

                                            const emailDate = new Date(parsed.date);

                                                parsedEmails.push({
                                                    message_id: parsed.messageId || '',
                                                    subject: parsed.subject || '',
                                                    from: parsed.from.value || '',
                                                    to: parsed.to.value || '',
                                                    date: emailDate.toISOString(),
                                                    folderName: folderName || '',
                                                    email_body: htmlToText(parsed.text || '').replace(/(\+|\r|\n)/g, ' ').trim(),
                                                    attachments: parsed.attachments.length,
                                                    flags: emailData.flags,
                                                    uid: emailData.uid,
                                                    bodystructure: emailData.bodystructure,
                                                    isSeen: emailData.flags.includes('\\Seen'),
                                                });
                                                console.log(`Parsed email from ${folderName}: ${parsed.messageId} || ${parsed.subject}`);
                                        } catch (parseErr) {
                                            console.error('Error parsing email:', parseErr);
                                        }
                                    });
                                });
                            });

                            fetch.once('error', (fetchErr) => {
                                console.error('Fetch error:', fetchErr);
                                fetchEmailReject(fetchErr);
                            });

                            fetch.once('end', () => {
                                console.log(`Done fetching messages from ${folderName}`);
                                fetchEmailResolve();
                            });
                        });
                    });
                });
            };

            const processFolders = async () => {
                const folderNames = imapFolders.length > 0 ? imapFolders : folders;
                for (const folder of folderNames) {
                    try {
                        await fetchFromFolder(folder);
                    } catch (err) {
                        console.error(`Error fetching emails from ${folder}:`, err);
                    }
                }
                imap.end();
            };

            processFolders().catch((err) => {
                console.error("Error processing folders:", err);
                imap.end();
            });
        });

        imap.once('error', (err) => {
            console.error('IMAP connection error:', err);
            reject(err);
        });

        imap.once('end', () => {
            console.log('IMAP Connection ended');
            resolve(parsedEmails);
        });

        imap.connect();
    });
};





module.exports = {
    fetchEmailsOutlook
}
