import React from "react";
import { Input } from "antd";
import CommentHistory from "../../common/CommentHistory";
import { PRIMARY_BLUE } from "../../../utils/colors";
// import { PRIMARY_BLUE } from "../constants/colors";

const CommentSection = ({
  checklist,
  rmGeneralComment,
  setRmGeneralComment,
  isActionAllowed,
  comments,
  commentsLoading,
}) => {
  return (
    <>
      {/* Display all comments from all users (CoCreator, RM, Checker) */}
      <div style={{ marginBottom: 12}}>
        <h4 style={{ color: PRIMARY_BLUE, fontWeight: 700, marginBottom: 12 }}>
          Comment Trail & History
        </h4>
        <CommentHistory comments={comments} isLoading={commentsLoading} />
      </div>

      <h3 style={{ marginTop: 12, color: PRIMARY_BLUE, fontWeight: "bold" }}>
        RM General Comment
      </h3>
      <Input.TextArea
        rows={3}
        value={rmGeneralComment}
        onChange={(e) => setRmGeneralComment(e.target.value)}
        placeholder="Enter RM general remarks..."
        style={{ borderRadius: 8, marginTop: 8 }}
        disabled={!isActionAllowed}
      />
    </>
  );
};

export default CommentSection;
