import React from "react";
import CommentHistory from "../../common/CommentHistory";
// import CommentHistory from "../common/CommentHistory";

const CommentSection = ({
  comments,
  commentsLoading,
  checkerComment,
  setCheckerComment,
  isDisabled,
}) => {
  return (
    <>
      <div className="comment-section">
        <label
          htmlFor="checkerComment"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Checker Comment
        </label>
        <textarea
          id="checkerComment"
          rows={3}
          value={checkerComment}
          onChange={(e) => setCheckerComment(e.target.value)}
          placeholder="Add your comment..."
          disabled={isDisabled}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
        />
      </div>

      <CommentHistory comments={comments} isLoading={commentsLoading} />
    </>
  );
};

export default CommentSection;
