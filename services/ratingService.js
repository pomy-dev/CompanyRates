import { supabase } from './supabaseService'; // Adjust the import path as needed

/**
 * Inserts a new rating into the 'ratings' table.
 * 
 * @param {Object} ratingData - The data to be inserted.
 * @param {string} ratingData.companyId - The UUID of the company.
 * @param {Object} ratingData.rating - The rating data (as JSON).
 * @param {string} ratingData.username - The username of the person giving the rating.
 * @param {string} ratingData.phoneNumber - The phone number of the person.
 * @param {string} ratingData.email - The email of the person.
 * @param {boolean} ratingData.sms - Whether to send an SMS.
 * @param {string} ratingData.servicePoint - The service point related to the rating.
 * 
 * @returns {Promise<Object>} - The result of the insert operation, including data or error.
 */
export const insertRating = async (ratingData) => {
  const { companyId, rating, username, phoneNumber, email, sms, servicePoint } = ratingData;

  const { data, error } = await supabase
    .from('ratings')
    .insert([
      {
        company_id: companyId,
        rating: rating,
        username: username,
        phone_number: phoneNumber,
        email: email,
        sms: sms,
        service_point: servicePoint,
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting rating:', error);
    throw error; // Rethrow the error for handling in the calling function
  }

  return data; // Return the inserted data
};


/**
 * Inserts new feedback into the 'feedback' table.
 * 
 * @param {Object} feedbackData - The data to be inserted.
 * @param {Object} feedbackData.comments - The comments (as JSON).
 * @param {string} feedbackData.suggestions - Suggestions for improvement.
 * @param {number} feedbackData.ratingId - The ID of the rating associated with the feedback.
 * 
 * @returns {Promise<Object>} - The result of the insert operation, including data or error.
 */
export const insertFeedback = async (feedbackData) => {
  const { comments, suggestions, ratingId, company_id } = feedbackData;

  const { data, error } = await supabase
    .from('feedback')
    .insert([
      {
        comments: comments,
        suggestions: suggestions,
        rating_id: ratingId,
        company_id: company_id,
      },
    ])
    .select();

  if (error) {
    console.error('Error inserting feedback:', error);
    throw error; 
  }

  return data; 
};

/**
 * Inserts new entries into the 'other' table.
 * 
 * @param {Object[]} otherData - The data to be inserted.
 * @param {string} otherData[].criteria - The criteria for the entry.
 * @param {string} otherData[].ratings - The ratings associated with the entry.
 * @param {string} otherData[].comments - Comments related to the entry.
 * @param {string} otherData[].companyId - The UUID of the company.
 * 
 * @returns {Promise<Object>} - The result of the insert operation, including data or error.
 */
export const insertOther = async (otherData) => {
  const { data, error } = await supabase
    .from('other')
    .insert(otherData)
    .select();

  if (error) {
    console.error('Error inserting into other table:', error);
    throw error; // Rethrow the error for handling in the calling function
  }

  return data; // Return the inserted data
};