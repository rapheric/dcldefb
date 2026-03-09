// // // // import React from "react";
// // // // import { Input, Select, Button, message } from "antd";

// // // // const { Option } = Select;

// // // // // Import your loan types (you'll need to adjust the path)
// // // // import { loanTypes } from "../../pages/docTypes"; // Adjust the path as needed

// // // // const DocumentInputSection = ({
// // // //   selectedCategoryName,
// // // //   setSelectedCategoryName = () => {},
// // // //   newDocName = "",
// // // //   setNewDocName = () => {},
// // // //   handleAddNewDocument = () => {},
// // // // }) => {
// // // //   const handleAddClick = () => {
// // // //     if (!newDocName.trim() || !selectedCategoryName) {
// // // //       return message.error(
// // // //         "Please enter a document name and select a category."
// // // //       );
// // // //     }
// // // //     handleAddNewDocument();
// // // //   };

// // // //   return (
// // // //     <div
// // // //       style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
// // // //     >
// // // //       <Input
// // // //         placeholder="Document Name"
// // // //         value={newDocName}
// // // //         onChange={(e) => setNewDocName(e.target.value)}
// // // //         style={{ flex: 1, minWidth: 200 }}
// // // //       />
// // // //       <Select
// // // //         placeholder="Select Loan Type"
// // // //         value={selectedCategoryName}
// // // //         onChange={setSelectedCategoryName}
// // // //         style={{ minWidth: 180 }}
// // // //         allowClear
// // // //         showSearch
// // // //         filterOption={(input, option) =>
// // // //           option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// // // //         }
// // // //       >
// // // //         {loanTypes.map((loanType) => (
// // // //           <Option key={loanType} value={loanType}>
// // // //             {loanType}
// // // //           </Option>
// // // //         ))}
// // // //       </Select>
// // // //       <Button type="primary" onClick={handleAddClick}>
// // // //         Add Document
// // // //       </Button>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DocumentInputSection;

// // // // export default DocumentInputSection;
// // // import React from "react";
// // // import { Input, Select, Button, message } from "antd";

// // // const { Option } = Select;

// // // // Import your loan types (you'll need to adjust the path)
// // // import { loanTypeDocuments } from "../../pages/docTypes"; // Adjust the path as needed

// // // const DocumentInputSectionCoCreator = ({
// // //   loanType,
// // //   selectedCategoryName,
// // //   setSelectedCategoryName = () => {},
// // //   newDocName = "",
// // //   setNewDocName = () => {},
// // //   handleAddNewDocument = () => {},
// // // }) => {
// // //   const handleAddClick = () => {
// // //     if (!newDocName.trim() || !selectedCategoryName) {
// // //       return message.error(
// // //         "Please enter a document name and select a category."
// // //       );
// // //     }
// // //     handleAddNewDocument();
// // //   };

// // //   // 1. Determine the source of categories
// // //   let categoriesToDisplay = [];

// // //   if (loanType && loanTypeDocuments[loanType]) {
// // //     // If loanType is provided and exists in the map, use its categories
// // //     categoriesToDisplay = loanTypeDocuments[loanType].map((cat) => cat.title);
// // //   }

// // //   return (
// // //     <div
// // //       style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
// // //     >
// // //       <Input
// // //         placeholder="Document Name"
// // //         value={newDocName}
// // //         onChange={(e) => setNewDocName(e.target.value)}
// // //         style={{ flex: 1, minWidth: 200 }}
// // //       />
// // //       <Select
// // //         // ⭐ UPDATED Placeholder to reflect category selection
// // //         placeholder={loanType ? "Select Category" : "Select Loan Type First"}
// // //         value={selectedCategoryName}
// // //         onChange={setSelectedCategoryName}
// // //         style={{ minWidth: 180 }}
// // //         allowClear
// // //         showSearch
// // //         // Disable the Select if no categories are available
// // //         // disabled={categoriesToDisplay.length === 0}
// // //         filterOption={(input, option) =>
// // //           option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// // //         }
// // //       >
// // //         {/* ⭐ MAP OVER THE FILTERED CATEGORIES (loanTypeDocuments[loanType]) */}
// // //         {categoriesToDisplay.map((categoryTitle) => (
// // //           <Option key={categoryTitle} value={categoryTitle}>
// // //             {categoryTitle}
// // //           </Option>
// // //         ))}
// // //       </Select>
// // //       <Button type="primary" onClick={handleAddClick}>
// // //         Add Document
// // //       </Button>
// // //     </div>
// // //   );
// // // };

// // // export default DocumentInputSection;
// // import React from "react";
// // import { Input, Select, Button, message } from "antd";

// // const { Option } = Select;

// // // Import your loan types (you'll need to adjust the path)
// // import { loanTypeDocuments } from "../../pages/docTypes"; // Adjust the path as needed

// // const DocumentInputSectionCoCreator = ({
// //   loanType,
// //   selectedCategoryName,
// //   setSelectedCategoryName = () => {},
// //   newDocName = "",
// //   setNewDocName = () => {},
// //   handleAddNewDocument = () => {},
// // }) => {
// //   const handleAddClick = () => {
// //     if (!newDocName.trim() || !selectedCategoryName) {
// //       return message.error(
// //         "Please enter a document name and select a category."
// //       );
// //     }
// //     handleAddNewDocument();
// //   };

// //   // 1. Determine the source of categories
// //   let categoriesToDisplay = [];

// //   if (loanType && loanTypeDocuments[loanType]) {
// //     // If loanType is provided and exists in the map, use its categories
// //     categoriesToDisplay = loanTypeDocuments[loanType].map((cat) => cat.title);
// //   }

// //   return (
// //     <div
// //       style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
// //     >
// //       <Input
// //         placeholder="Document Name"
// //         value={newDocName}
// //         onChange={(e) => setNewDocName(e.target.value)}
// //         style={{ flex: 1, minWidth: 200 }}
// //       />
// //       <Select
// //         // ⭐ UPDATED Placeholder to reflect category selection
// //         placeholder={loanType ? "Select Category" : "Select Loan Type First"}
// //         value={selectedCategoryName}
// //         onChange={setSelectedCategoryName}
// //         style={{ minWidth: 180 }}
// //         allowClear
// //         showSearch
// //         // Disable the Select if no categories are available
// //         disabled={categoriesToDisplay.length === 0}
// //         filterOption={(input, option) =>
// //           option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// //         }
// //       >
// //         {/* ⭐ MAP OVER THE FILTERED CATEGORIES (loanTypeDocuments[loanType]) */}
// //         {categoriesToDisplay.map((categoryTitle) => (
// //           <Option key={categoryTitle} value={categoryTitle}>
// //             {categoryTitle}
// //           </Option>
// //         ))}
// //       </Select>
// //       <Button type="primary" onClick={handleAddClick}>
// //         Add Document
// //       </Button>
// //     </div>
// //   );
// // };

// // export default DocumentInputSectionCoCreator;
// const DocumentInputSectionCoCreator = ({
//   loanType,
//   selectedCategoryName,
//   setSelectedCategoryName = () => {},
//   newDocName = "",
//   setNewDocName = () => {},
//   handleAddNewDocument = () => {},
// }) => {
//   const categoriesToDisplay =
//     loanType && loanTypeDocuments[loanType]
//       ? loanTypeDocuments[loanType].map((cat) => cat.title)
//       : [];

//   const handleAddClick = () => {
//     if (!newDocName.trim() || !selectedCategoryName) {
//       return message.error(
//         "Please enter a document name and select a category."
//       );
//     }
//     handleAddNewDocument();
//   };

//   return (
//     <div
//       style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
//     >
//       <Input
//         placeholder="Document Name"
//         value={newDocName}
//         onChange={(e) => setNewDocName(e.target.value)}
//         style={{ flex: 1, minWidth: 200 }}
//       />

//       <Select
//         placeholder={loanType ? "Select Category" : "Select Loan Type First"}
//         value={selectedCategoryName}
//         onChange={setSelectedCategoryName}
//         style={{ minWidth: 180 }}
//         allowClear
//         showSearch
//         disabled={!loanType}
//       >
//         {categoriesToDisplay.map((title) => (
//           <Option key={title} value={title}>
//             {title}
//           </Option>
//         ))}
//       </Select>

//       <Button type="primary" onClick={handleAddClick}>
//         Add Document
//       </Button>
//     </div>
//   );
// };
// export default DocumentInputSectionCoCreator;
// src/components/DocumentInputSectionCoCreator.jsx

import React from "react";
import { Input, Select, Button, message } from "antd";
import { loanTypeDocuments } from "../../pages/docTypes";

const { Option } = Select;

const DocumentInputSectionCoCreator = ({
  loanType, // ✅ REQUIRED
  newDocName,
  setNewDocName,
  selectedCategoryName,
  setSelectedCategoryName,
  handleAddNewDocument,
}) => {
  const categories = React.useMemo(() => {
    if (!loanType) return [];

    // Split types by comma (handles "A, B" cases) or just use the single type
    const typesToCheck = loanType
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const allUniqueCategories = new Set();

    typesToCheck.forEach((type) => {
      // Find the entry that matches (case-insensitive)
      const exactMatch = Object.keys(loanTypeDocuments).find(
        (key) => key.toLowerCase() === type.toLowerCase(),
      );

      if (exactMatch && loanTypeDocuments[exactMatch]) {
        loanTypeDocuments[exactMatch].forEach((group) => {
          if (group.title) allUniqueCategories.add(group.title);
        });
      }
    });

    // Fallback: If no categories were found, it might be the general "Multiple Loan Type" placeholder
    if (allUniqueCategories.size === 0 && loanType) {
      Object.values(loanTypeDocuments).forEach((catList) => {
        catList.forEach((cat) => allUniqueCategories.add(cat.title));
      });
    }

    return Array.from(allUniqueCategories).sort();
  }, [loanType]);

  const handleAddClick = () => {
    if (!newDocName.trim() || !selectedCategoryName) {
      return message.error("Enter document name and select a category");
    }
    handleAddNewDocument();
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
      <Input
        placeholder="Document Name"
        value={newDocName}
        onChange={(e) => setNewDocName(e.target.value)}
        style={{ flex: 1, minWidth: 220 }}
      />

      <Select
        placeholder={loanType ? "Select Category" : "Select Loan Type First"}
        value={selectedCategoryName}
        onChange={setSelectedCategoryName}
        style={{ minWidth: 220 }}
        allowClear
        showSearch
        disabled={!loanType}
      >
        {categories.map((title) => (
          <Option key={title} value={title}>
            {title}
          </Option>
        ))}
      </Select>

      <Button
        type="primary"
        onClick={handleAddClick}
        style={{
          backgroundColor: "#164679 !important",
          borderColor: "#164679 !important",
          color: "#fff !important",
        }}
        className="primary-dcl-button"
      >
        Add Document
      </Button>
    </div>
  );
};

export default DocumentInputSectionCoCreator;
