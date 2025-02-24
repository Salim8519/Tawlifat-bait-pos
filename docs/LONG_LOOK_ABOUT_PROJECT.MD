Document 1: Project Overview & Goals

Project Title: POS (Point of Sale) System with Multi-Business, Vendor, and Branch Support
High-Level Goal: To create a flexible and scalable POS system that allows multiple independent businesses (owners) to manage their sales, inventory, staff, and vendors, even across multiple locations.
Key Features:
User Role Management (Admin, Owner, Manager, Cashier, Vendor)
Multi-Business Support: Each business has unique code and can have multiple locations
Branch Management: Allows businesses to define and manage multiple physical locations.
Vendor Management: Owners can invite/create vendors who supply products to their businesses.
Sales Transactions: Recording of sales, including cashier, products, payment methods, and customer information.
Inventory Management: (Covered in other doc, but important) Tracking stock levels of products.
Reporting: (Will need more definition later) Sales reports, cash tracking, vendor transactions,
Tax Management: Monthly tax tracking of Sales.
Document 2: User Roles and Permissions

This table outlines the roles within the POS system and their corresponding permissions. Understanding these roles is foundational to understanding the flow of the application.

Role	Description	Permissions	Notes
Admin	Superuser; manages all aspects of the system, including users across all businesses.	Create/Edit/Delete any user. Access all data across all businesses. Manage system-wide settings.	Handles the system-wide administration.
Owner	Owns a business; can add managers and cashiers, manage branches, and invite/create vendors that belong to his bussnies	Add/Edit/Delete Managers and Cashiers for their specific business. Create/Manage Branches. Invite/Create Vendors and assign them branches. Configure basic business settings. View reporting for their business	Each owner has a unique business_code. Manages their entire business.
Manager	Similar to Owner but cannot create other managers.	Same as owner EXCEPT adding new managers. Similar access to owner for bussnies	Assigned to specific businessbusiness_code and branch.
Cashier	Responsible for processing sales transactions.	Record sales. Manage cash drawer. Limited access to reporting (e.g., daily sales).	Assigned to specific businessbusiness_code and branch.
Vendor	Supplies products; can supply products to branches assigned to them by owner	Manage their product catalog (if allowed). View transaction history related to supplied products.	Assigned to one or more branches of different businesses. Has vendor_business_code
Document 3: Core Data Model (Database Tables)

Focus on the essential tables for a new coder. This simplifies the database schema to the tables most often interacted during the project.

Table Name	Description	Key Columns	Relationships	Notes
profiles	Stores user profiles, roles, business associations, and vendor details.	user_id (links to auth user), id (UUID), business_code, vendor_business _name (Vendor bussnies names)	Links to auth.users (user management)	Crucial for authentication and authorization throughout the system. Holds which business user are assoated to
branches	Stores the names and codes of each branch.	branch_id (UUID), branch_name, business_code	One-to-many relationship with Profiles (users assigned to branches). One-to-many with vendor_assignments	Each business can have multiple branches.
business_settings	Configuration settings for each business (tax rates, receipt formats, etc.). Important: uses business_code_	setting_id (UUID), business_code_, tax_rate	One-to-one relationship with a business (implied through business_code_).	IMPORTANT: business_code_ (note the underscore).
products	Stores product information, pricing, and inventory levels.	product_id (INT, auto-increment), product_name, price, quantity, business_code_of_owner,business_code_if_vendor	V	Key for sales transactions vendor product has business_code_if_vendor
receipts	Stores records of individual sales transactions.	receipt_id (TEXT), transaction_id (TEXT), business_code, branch_name, total_amount, cashier_name,	One-to-many with sold_products.	Crucial for sales data tracking and reporting.
sold_products	Stores individual items sold within a transaction.	sold_product_id (TEXT), receipt_id, product_name, quantity, unit_price_original, unit_price_by_bussniess,business_code	One-to-one with receipts.	Captures which item sold for how much
vendor_assignments	Stores the vendor assignments for branches	vendor_email_identifier (TEXT),owner_business_code, vendor_business_code,branch_name	,	Connects Branchs, owner and Venndor.
transactions_overall	Stores the overall transction.	transaction_id (UUID),business_code, branch_name, amount,business_name		Transctions for the whole shop
Document 4: Vendor Workflow (Simplified)

Owner Creates/Invites Vendor: The owner adds a vendor via the UI/Backend. This typically involves:

Creating a new user with the "Vendor" Role
Storing user information in the profiles table.
The business name is stored in the vendor_business _name column of the profiles table.
Owner Assigns Vendor to Branches:  The owner assigns the vendor to one or more branches of their business.

This involves creating entries in the vendor_assignments table, linking the owner_business_code, vendor_business_code, and branch_name.
Vendor Manages Products (Potentially):  Depending on the flow of the software, the business can the products for the products table to sell

Important Product quantities are tied back to the originating vendor via the vendor_code_if_by_bussnies .
Sales Transactions:

When a cashier sells a product supplied by a vendor:
An entry is created in the receipts table.
Entries are created in the sold_products table, including the vendor_code_if_by_vendor  from the vendot bussnies is true otherwise is empty
Commission calculations and payouts are tracked on the transactions_overall table only, this process is described in detail above
Key Considerations/Notes (For the New Coder – Important)

Business Code is King: The business_code is the primary key for differentiating businesses throughout the system. Use it consistently in queries.
Vendor Business Name: Although similar, the column is named vendor_business _name
Table and Column Names: Always double-check table and column names! Case sensitivity matters in many database systems.
UUIDs vs Text IDs: Note the use of UUIds (branch_id in branches, setting_id in business_settings, trasctiona_id on the transactions_overall table, id on the profiles table) and TEXT based id' (receipt_id in receipts, sold_product_id in sold_products) Make sure to choose these datatypes.
Security: Security is paramount. Always validate user inputs and protect against SQL injection.
This document provides a streamlined view of the project. The tables are heavily simplified. As the coder becomes more familiar, they can dive deeper into the other aspects. Remember that the data types are important and the new coder should analyze the attached document.