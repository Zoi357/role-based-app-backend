
let employees = JSON.parse(localStorage.getItem('employees')) || [];
let departments = JSON.parse(localStorage.getItem('departments')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// DOM references (ensure elements exist before use)
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const navbar = document.getElementById('navbar');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');
const accountsSection = document.getElementById('accountsSection');
const employeesSection = document.getElementById('employeesSection');
const departmentsSection = document.getElementById('departmentsSection');
const myRequestsSection = document.getElementById('myRequestsSection');
const homeSection = document.getElementById('homeSection');
const accountsTable = document.getElementById('accountsTable');
const employeeTable = document.getElementById('employeeTable');
const employeeForm = document.getElementById('employeeForm');
const empId = document.getElementById('empId');
const empName = document.getElementById('empName');
const empPosition = document.getElementById('empPosition');
const empDept = document.getElementById('empDept');
const departmentForm = document.getElementById('departmentForm');
const deptName = document.getElementById('deptName');
const deptHead = document.getElementById('deptHead');
const departmentsTable = document.getElementById('departmentsTable');
const myRequestsTable = document.getElementById('myRequestsTable');
const dropdownMenu = document.getElementById('dropdownMenu');

async function login() {
    if (!loginUsername || !loginPassword) return alert('Login inputs not found');
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginUsername.value, password: loginPassword.value })
        });

        const data = await res.json();
        if (!res.ok) return alert('Login failed: ' + (data.error || 'Unknown'));

        sessionStorage.setItem('authToken', data.token);
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        enterPortal();
    } catch (err) {
        alert('Network error');
    }
}

function getAuthHeader(){
    const token = sessionStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loadAdminDashboard(){    
    const res = await fetch('http://localhost:3000/api/admin/dashboard',{
        headers: getAuthHeader()
    });
    if (res.ok){
        const data = await res.json();
        document.getElementById('content').innerText=data.message;
    }else{
        document.getElementById('content').innerText='Access denied';
    }
}


async function register() {
    if (!regEmail.value || !regEmail.value.endsWith('@example.com'))
        return alert('Email must be @example.com');

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: regUsername.value, password: regPassword.value, role: regRole.value })
        });
        const data = await res.json();
        if (!res.ok) return alert('Register failed: ' + (data.error || 'Unknown'));
        alert('Registered successfully! Please log in.');
        showLogin();
    } catch (err) {
        alert('Network error');
    }
}


function enterPortal() {
    navbar.style.display = "flex";
    loginSection.style.display = "none";
    registerSection.style.display = "none";
    showHome();
}

function showLogin() {
    registerSection.style.display = "none";
    loginSection.style.display = "block";
}

function showRegister() {
    loginSection.style.display = "none";
    registerSection.style.display = "block";
}

function hideSections() {
    homeSection.style.display = "none";
    employeesSection.style.display = "none";
    profileSection.style.display = "none";
    departmentsSection.style.display = "none";
    myRequestsSection.style.display = "none";
}
function populateDepartmentDropdown(){
    empDept.innerHTML = '<option value="">Select Department</option>';

    departments.forEach(dept => {
        empDept.innerHTML += `<option value="${dept.name}">${dept.name}</option>`;
    });
}

function showHome() {
    hideSections();
    homeSection.style.display = "block";
}

function showEmployees() {
    hideSections();
    employeesSection.style.display = "block";
    renderEmployees();
}

function showProfile() {
    hideSections();
    profileSection.style.display = "block";
    profileEmail.textContent = currentUser.email;
    profileRole.textContent = currentUser.role;
}

function showAccounts() {
    if (currentUser.role !== "admin") {
        alert("Access denied. Admins only.");
        return;
    }
    hideSections();
    accountsSection.style.display = "block";
    renderAccounts();   
}

function showDepartments() {
    hideSections();
    departmentsSection.style.display = "block";
    renderDepartments();
}

function showMyRequests() {
    hideSections();
    myRequestsSection.style.display = "block";
    renderMyRequests();
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

function toggleDropdown() {
    dropdownMenu.style.display =
        dropdownMenu.style.display === "block" ? "none" : "block";
}

function toggleEmployeeForm(editIndex = null) {
    populateDepartmentDropdown();
    if (editIndex !== null) {
        const emp = employees[editIndex];
        empId.value = emp.id;
        empName.value = emp.name;
        empPosition.value = emp.position;
        empDept.value = emp.dept;
        employeeForm.dataset.editIndex = editIndex;
    } else {
        empId.value = '';
        empName.value = '';
        empPosition.value = '';
        empDept.value = '';
        delete employeeForm.dataset.editIndex;
    }

    employeeForm.style.display =
        employeeForm.style.display === "block" ? "none" : "block";
}

function addOrUpdateEmployee() {
    const editIndex = employeeForm.dataset.editIndex;

    if (editIndex !== undefined) {
        employees[editIndex] = {
            id: empId.value,
            name: empName.value,
            position: empPosition.value,
            dept: empDept.value
        };
    } else {
        employees.push({
            id: empId.value,
            name: empName.value,
            position: empPosition.value,
            dept: empDept.value
        });
    }

    localStorage.setItem('employees', JSON.stringify(employees));
    renderEmployees();
    toggleEmployeeForm();
}

function renderEmployees() {
    if (employees.length === 0) {
        employeeTable.innerHTML = `<tr><td colspan="5" style="text-align:center">No employees.</td></tr>`;
        return;
    }

    employeeTable.innerHTML = "";
    employees.forEach((e, index) => {
        employeeTable.innerHTML += `
            <tr>
                <td>${e.id}</td>
                <td>${e.name}</td>
                <td>${e.position}</td>
                <td>${e.dept}</td>
                <td>
                    <button onclick="toggleEmployeeForm(${index})">Edit</button>
                    <button onclick="deleteEmployee(${index})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteEmployee(index) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    employees.splice(index, 1);
    localStorage.setItem('employees', JSON.stringify(employees));
    renderEmployees();
}

function toggleDepartmentForm(editIndex = null) {
    if (!window.departmentForm) return;
    if (editIndex !== null) {
        const dept = departments[editIndex];
        deptName.value = dept.name;
        deptHead.value = dept.head;
        departmentForm.dataset.editIndex = editIndex;
    } else {
        deptName.value = '';
        deptHead.value = '';
        delete departmentForm.dataset.editIndex;
    }
    departmentForm.style.display =
        departmentForm.style.display === "block" ? "none" : "block";
}

function addOrUpdateDepartment() {
    const editIndex = departmentForm.dataset.editIndex;

    if (editIndex !== undefined) {
        departments[editIndex] = {
            name: deptName.value,
            head: deptHead.value
        };
    } else {
        departments.push({
            name: deptName.value,
            head: deptHead.value
        });
    }

    localStorage.setItem('departments', JSON.stringify(departments));
    renderDepartments();
    toggleDepartmentForm();
}

function renderAccounts() {
    if (users.length === 0) {
        accountsTable.innerHTML =
            `<tr><td colspan="4" style="text-align:center">No accounts.</td></tr>`;
        return;
    }

    accountsTable.innerHTML = "";
    users.forEach((u, index) => {
        accountsTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
            </tr>
        `;
    });
}

function renderDepartments() {
    if (!window.departmentsTable) return;
    if (departments.length === 0) {
        departmentsTable.innerHTML = `<tr><td colspan="3" style="text-align:center">No departments.</td></tr>`;
        return;
    }

    departmentsTable.innerHTML = '';
    departments.forEach((d, index) => {
        departmentsTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${d.name}</td>
                <td>${d.head}</td>
                <td>
                    <button onclick="toggleDepartmentForm(${index})">Edit</button>
                    <button onclick="deleteDepartment(${index})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteDepartment(index) {
    if (!confirm("Are you sure you want to delete this department?")) return;
    departments.splice(index, 1);
    localStorage.setItem('departments', JSON.stringify(departments));
    renderDepartments();
}

let myRequests = JSON.parse(localStorage.getItem('myRequests')) || [];

function renderMyRequests() {
    if (!window.myRequestsTable) return;
    if (myRequests.length === 0) {
        myRequestsTable.innerHTML = `<tr><td colspan="3" style="text-align:center">No requests.</td></tr>`;
        return;
    }

    myRequestsTable.innerHTML = '';
    myRequests.forEach((r, index) => {
        myRequestsTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${r.title}</td>
                <td>${r.status}</td>
                <td>
                    <button onclick="deleteRequest(${index})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteRequest(index) {
    if (!confirm("Are you sure you want to delete this request?")) return;
    myRequests.splice(index, 1);
    localStorage.setItem('myRequests', JSON.stringify(myRequests));
    renderMyRequests();
}

window.onload = function() {
    if (currentUser) {
        enterPortal();
    } else {
        loginSection.style.display = "block";
        navbar.style.display = "none";
    }
};