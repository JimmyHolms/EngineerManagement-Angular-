//export const  baseUrl = "http://atlas.live.infocabsglobal.com";
export const  baseUrl = "http://localhost:3000";
//export const baseUrl ="http://atlas.stage.infocabs.com";
export const  api_path = baseUrl + "/api";
export const  signup_path = api_path +"/users";
export const  login_path = api_path + "/operators/login";
export const  operator_path = api_path +"/operators";
export const  job_path = api_path + "/jobs";
export const  jobengineer_path = api_path + "/jobs/engineers";
export const  engineer_path = api_path + "/engineers";
export const  customer_path = api_path + "/customers";
export const  category_path = api_path + "/static/categories";
export const  skill_path = api_path + "/static/skills";
export const  jobscheduling_path = api_path + "/static/job_scheduling_options";
export const  image_path = api_path + "/images";

export const  unapprovedcustomer_path = customer_path + "/unapproved";
export const  approvedcustomer_path = customer_path + "/approved";
export const  approvecustomer_path = customer_path +"/approve";

export const  unapprovedengineer_path = engineer_path + "/unapproved";
export const  approvedengineer_path = engineer_path + "/approved";
export const  approveengineer_path = engineer_path + "/approve";

export const  upload_operator_profile = image_path + "/operators";
export const  upload_customer_profile = image_path + "/customers";
export const  upload_engineer_profile = image_path + "/engineers";
export const  upload_engineer_certificateImage = image_path + "/certificates";
export const  upload_job_imagePath = image_path + "/job";
export const  upload_job_workitemPath = upload_job_imagePath + "/workitem";

export const  forgot_user_password = signup_path + "/forgot";
export const  forgot_customer_password = customer_path + "/forgot";
export const  forgot_engineer_password = engineer_path + "/forgot";

export const  reset_user_password = signup_path + "/reset";

export const boundary = "--Boundary_1_1626119499_1392398808202";

export const  customer_login = api_path + "/customers/login";
export const  customer_jobhistory = api_path + "/jobs/myjobs"; 
export const  customerupdate_path = api_path + "/customers";
export const  customerChangePassword_path = api_path + "/customers/password";

export const  customerUploadImage_path = api_path + "/images/customers";

export const  customerforgot_path = api_path + "/customers/forgot";
export const  customerCreditCard_path = api_path +  "/customers/credit-card";

export const  invoice_Get= api_path + '/invoices';
export const  invoice_Active = api_path + '/invoices/active';
export const  invoice_submitted = api_path + '/invoices/submitted';
export const  invoice_paid = api_path + '/invoices/paid';
export const  invoice_creditcard = api_path + '/invoices/charge';
export const  invoice_aproved = api_path + '/invoices/approve';
export const  invoice_aprovelist= api_path + '/invoices/approved';