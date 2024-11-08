// elasticService.js
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
const userService = require('./userService');
const { STATUS_CODE } = require('../constants/constants');

/**
 * Function to perform dynamic operations on Elasticsearch
 * @param {string} indexName - The index name in Elasticsearch
 * @param {string} operation - Operation type: 'insert', 'update', or 'delete'
 * @param {Object} data - An object with column names and values
 * @param {Object} [where] - A condition object to identify the document(s) to update or delete
 * @returns {Object} Result of the Elasticsearch operation
 */
const handleElasticOperation = async (indexName, operation, data, where = null) => {
  try {
      let result;

      switch (operation) {
          case 'insert':
              // Insert a new document
              result = await elasticsearchClient.index({
                  index: indexName,
                  document: data
              });
              break;

          case 'update':
              if (!where || !where.id) {
                  throw new Error("Update operation requires a 'where' condition with 'id'");
              }
              // Update an existing document based on the provided ID
              result = await elasticsearchClient.update({
                  index: indexName,
                  id: where.id,
                  doc: data
              });
              break;

          case 'delete':
              if (!where || !where.id) {
                  throw new Error("Delete operation requires a 'where' condition with 'id'");
              }
              // Delete a document based on the provided ID
              result = await elasticsearchClient.delete({
                  index: indexName,
                  id: where.id
              });
              break;

          default:
              throw new Error("Unsupported operation type. Use 'insert', 'update', or 'delete'.");
      }

      console.log(`${operation} operation completed successfully`);
      return result;

  } catch (error) {
      console.error(`Error performing ${operation} operation:`, error.message || error);
      throw error;
  }
};

module.exports = {
  createInitialIndices
};
