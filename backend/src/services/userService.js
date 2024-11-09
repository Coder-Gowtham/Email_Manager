const { ENTERING_TO, SERVICE_METHOD, STATUS_CODE } = require('../constants/constants');
const client = require('../utils/elasticsearchClient');


const searchUser = async (email, userIndexName) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | searchUser || ${JSON.stringify({ email, userIndexName })}`);

    try {
        const searchResults = await client.search({
            index: userIndexName,
            body: {
                query: {
                    match: {
                        personal_email: email
                    }
                }
            }
        });

        console.log(`searchResults response | ${JSON.stringify(searchResults)}`);

        // Check if there are any results
        if (searchResults?.hits?.total?.value > 0) {
            return searchResults.hits.hits[0]._source; // Returns full user data
        } else {
            console.log(`No user found with email: ${email}`);
            return null; // Return null if no user is found
        }
    } catch (error) {
        console.error('Error searching for user:', error);
        // Handle errors and provide helpful response
        const dbErrorResponse = {
            status: error?.status || STATUS_CODE.DATABASE_ERROR,
            message: "Error executing query on database.",
            error: error.message || error
        };
        throw dbErrorResponse;
    }
};

const createUser = async (userId, email, hashedPassword, userIndexName) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | createUser || ${JSON.stringify([userId, email, hashedPassword, userIndexName])}`);

    try {
        const userData = {
            user_id: userId,
            personal_email: email,
            password: hashedPassword
        };

        // Create user in Elasticsearch
        const createResponse = await client.index({
            index: userIndexName,
            document: userData,
        });

        console.log(`User created successfully: ${createResponse}`);
        return createResponse;
    } catch (error) {
        console.error('Error creating user:', error);
        const dbErrorResponse = {
            status: error?.status || STATUS_CODE.DATABASE_ERROR,
            message: "Error executing to databse.",
            error: error
        };
        throw dbErrorResponse;
    }
};

const createIndicesService = async (indices, client) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | createIndices || ${JSON.stringify(indices)}`);

    const response = {};
    try {
        for (const userIndexName of indices) {
            // Check if the index already exists
            const indexExists = await client.indices.exists({ index: userIndexName });

            console.log(`is indexExists || ${userIndexName} => ${indexExists}`);

            if (indexExists) {
                console.log(`Index already exists: ${userIndexName}`);
                response.message = `Index already exists: ${userIndexName}`
            } else if (!indexExists) {
                let body;
                if (userIndexName === 'user_accounts') {
                    body = {
                        mappings: {
                            properties: {
                                user_id: { type: "keyword" },
                                outolok_id: { type: "keyword" },
                                personal_email: { type: "keyword" },
                                password: { type: "text" },
                                outlook_email: { type: "keyword" },
                                outlook_displayName: { type: "keyword" },
                                oauth: { type: "boolean" },
                                userPrincipalName: { type: "keyword" },
                                access_token: { type: "text" },
                                refresh_token: { type: "text" },
                                last_sync: { type: "date" },
                                userMailBoxName: { type: "keyword" }
                            }
                        }
                    };
                } else if (userIndexName === 'email_messages') {
                    body = {
                        mappings: {
                            properties: {
                                message_id: { type: "keyword" },
                                user_id: { type: "keyword" },
                                subject: { type: "text" },
                                sender: {
                                    properties: {
                                        name: { type: "text" },
                                        email: { type: "keyword" }
                                    }
                                },
                                received_at: { type: "date" },
                                status: { type: "keyword" },
                                body: { type: "text" },
                                folder: { type: "keyword" },
                                flags: { type: "text" }
                            }
                        }
                    };
                } else if (userIndexName === 'mailbox_details') {
                    body = {
                        mappings: {
                            properties: {
                                user_id: { type: "keyword" },
                                total_emails: { type: "integer" },
                                unread_emails: { type: "integer" },
                                last_updated: { type: "date" }
                            }
                        }
                    };
                } else {
                    console.warn(`No mappings defined for index: ${userIndexName}`);
                    continue;
                }

                // Create the index with the specified mappings
                await client.indices.create({
                    index: userIndexName,
                    body,
                });
                console.log(`Index created: ${userIndexName}`);
            }
        }
        response.message = `Initial indices processed successfully! `
        return { success: STATUS_CODE.SUCCESS, message: response.message }
    } catch (error) {
        console.error(`Error in createIndicesService || ${error.message}`);
        const dbErrorResponse = {
            status: error?.status || 510,
            message: "Error executing to database.",
            error: error
        };
        throw dbErrorResponse;
    }
};

const updateUserDetails = async (userId, token, outlookEmail, userMailBoxName) => {
    try {
        // Check if the user exists in the index
        const resp = await client.search({
            index: 'user_accounts',  // Specify the index
            body: {
                query: {
                    match: {
                        user_id: userId  // Replace userId with the actual value you want to check
                    }
                }
            }
        });

        if (resp?.hits?.total?.value > 0) {
            console.log('User exists!');
        } else {
            console.log('User does not exist.');
        }


        if (resp.hits.hits.total.value > 0) {


            // Update the user details
            const response = await client.update({
                index: 'user_accounts',
                id: userId,
                body: {
                    doc: {
                        userMailBoxName: userMailBoxName,
                        access_token: token,
                        outlook_email: outlookEmail
                    }
                }
            });

            return {
                status: STATUS_CODE.SUCCESS,
                message: `User details updated successfully for user_id ${userId}.`,
                result: response
            };
        } else {
            return {
                status: STATUS_CODE.NOT_FOUND,
                message: `User with user_id ${userId} not found in index user_accounts.`
            };
        }
    } catch (error) {
        console.error(`Error updating user details for user_id ${userId}:`, error.message || error);
        return {
            status: STATUS_CODE.DATABASE_ERROR,
            message: `Error updating user details for user_id ${userId}.`,
            error: error.message || error
        };
    }
};

const fetchUserId = async (email, userIndexName) => {
    console.log(`${ENTERING_TO} ${SERVICE_METHOD} | searchUser || ${JSON.stringify({ email, userIndexName })}`);

    try {
        const searchResults = await client.search({
            index: userIndexName,
            body: {
                query: {
                    match: {
                        outlook_email: email
                    }
                }
            }
        });

        console.log(`searchResults response | ${JSON.stringify(searchResults)}`);

        // Check if there are any results
        if (searchResults?.hits?.total?.value > 0) {
            return searchResults.hits.hits[0]._source; // Returns full user data
        } else {
            console.log(`No user found with email: ${email}`);
            return null; // Return null if no user is found
        }
    } catch (error) {
        console.error('Error searching for user:', error);
        // Handle errors and provide helpful response
        const dbErrorResponse = {
            status: error?.status || STATUS_CODE.DATABASE_ERROR,
            message: "Error executing query on database.",
            error: error.message || error
        };
        throw dbErrorResponse;
    }
};


module.exports = {
    searchUser,
    createUser,
    updateUserDetails,
    createIndicesService,
    fetchUserId
};
