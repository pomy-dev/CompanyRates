import { supabase } from './supabaseService'; // Adjust the import path as needed

export const insertUser = async (userData) => {

  const { data, error } = await supabase
    .from('Users')
    .insert(userData)
    .select('*').single();

  if (error) {
    console.error('Error inserting user:', error);
    throw error; // Rethrow the error for handling in the calling function
  }

  return data; // Return the inserted data
};

/**
 * Inserts a new rating into the 'ratings' table.
 * 
 * @param {Object} ratingData - The data to be inserted.
 * @param {number} userId
 * @param {string} ratingData.companyId - The UUID of the company.
 * @param {Object} ratingData.rating - The rating data (as JSON).
 * @param {boolean} ratingData.sms - Whether to send an SMS.
 * @param {string} ratingData.servicePoint - The service point related to the rating.
 * 
 * @returns {Promise<Object>} - The result of the insert operation, including data or error.
 */
export const insertRating = async (userId, ratingData) => {
  const { companyId, rating, sms, servicePoint } = ratingData;

  const { data, error } = await supabase
    .from('ratings')
    .insert([
      {
        company_id: companyId,
        rating: rating,
        user_id: userId,
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
 * @param {number} userId
 * @param {Object} feedbackData.comments - The comments (as JSON).
 * @param {string} feedbackData.suggestions - Suggestions for improvement.
 * @param {number} feedbackData.ratingId - The ID of the rating associated with the feedback.
 * 
 * @returns {Promise<Object>} - The result of the insert operation, including data or error.
 */
export const insertFeedback = async (userId, feedbackData) => {
  const { comments, suggestions, ratingId, company_id } = feedbackData;

  const { data, error } = await supabase
    .from('feedback')
    .insert([
      {
        user_id: userId,
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
 * @param {number} userId
 * @param {string} otherData[].criteria - The criteria for the entry.
 * @param {string} otherData[].ratings - The ratings associated with the entry.
 * @param {string} otherData[].comments - Comments related to the entry.
 * @param {string} otherData[].companyId - The UUID of the company.
 * 
 * @returns {Promise<Object>} - The result of the insert operation, including data or error.
 */
export const insertOther = async (userId, otherData) => {
  const { data, error } = await supabase
    .from('other')
    .insert([{
      user_id: userId,
      criteria: otherData?.criteria,
      ratings: otherData?.ratings,
      comments: otherData?.comments,
      department: otherData?.department,
      company_id: otherData?.company_id
    }])
    .select();

  if (error) {
    console.error('Error inserting into other table:', error);
    throw error; // Rethrow the error for handling in the calling function
  }

  return data; // Return the inserted data
};