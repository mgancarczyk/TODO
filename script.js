// Firebase settings

const config = {
  apiKey: "AIzaSyCOv7g1c5Li5hd2cr36oNAZKjineEJ98JU",
  authDomain: "todo-mg.firebaseapp.com",
  databaseURL: "https://todo-mg.firebaseio.com",
  projectId: "todo-mg",
  storageBucket: "todo-mg.appspot.com",
  messagingSenderId: "1073053472754"
};
firebase.initializeApp(config);
const db = firebase.firestore();

// DOM helpers


function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

function removeChildren(htmElement) {
  while (htmElement.lastChild) {
    htmElement.removeChild(htmElement.lastChild);
  }
}

// Material design

function openCollectionCreationModal() {
  document.getElementById("add-list-form").reset();
  dialog.open();
}

let selectedCollection = '';

function onCollectionClick(collectionElement, collectionName) {
  selectedCollection = collectionName;

  const previouslySelectedCollection = document.getElementsByClassName('mdc-list-item--activated')[0];
  document.getElementById("add-todo-form").reset();
  document.getElementById("collection-title").innerText = collectionName;
  if (previouslySelectedCollection) {
    previouslySelectedCollection.classList.remove('mdc-list-item--activated');
  }
  collectionElement.classList.add('mdc-list-item--activated')

  loadTodosByCollectionName(collectionName)
}

function createCollectionMenuItem(collectionName) {
  const collectionMenuItem = document.createElement('div');
  collectionMenuItem.innerHTML = /*html*/`
    <a class="mdc-list-item mdc-list-item" onclick="onCollectionClick(this, '${collectionName}')">
      <i class="material-icons mdc-list-item__graphic" >list</i>${sanitizeHTML(collectionName)}
    </a>
  `;
  return collectionMenuItem;
}

function loadCollections() {
  const collectionList = document.getElementById("navigation")
  db.collection('todos').onSnapshot((result) => {
    collectionList.innerHTML = '';
    result.docs.forEach((doc,index) => {
      const collectionMenuItem = createCollectionMenuItem(doc.id);
      collectionList.appendChild(collectionMenuItem);
      if (index === 0) {
        console.log(index);
        collectionMenuItem.children[0].click();
      }
    });
  });
}

function createTodoListItem(todo, index) {
  const todoListItem = document.createElement('div')
  const actionIcon = todo.done ? 'delete' : 'timer';
  const todoText = todo.text;
  const actionOnClick = todo.done ? `removeTodo('${todoText}')` : `setToInProgress('${todoText}')`;

  todoListItem.innerHTML = /*html*/`
  <li class="mdc-list-item" role="option"">
    <div class="mdc-checkbox">
      <input type="checkbox"
            class="mdc-checkbox__native-control"
            ${todo.done ? "checked" : ""}
            id="checkbox-${index}"
            onclick="markTodoAsDone(this, '${todoText}')"
      />
      <div class="mdc-checkbox__background">
        <svg class="mdc-checkbox__checkmark"
            viewBox="0 0 24 24">Ž
          <path class="mdc-checkbox__checkmark-path"
                fill="none"
                d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
        </svg>
        <div class="mdc-checkbox__mixedmark"></div>
      </div>
    </div>
    <span class="mdc-list-item__text ${todo.done ? "done" : ""}">${sanitizeHTML(todo.text)}</span>
    <span class="mdc-list-item__meta material-icons ${!todo.done && todo.inProgress ? "inProgress" : ""}" onclick="${actionOnClick}">${actionIcon}</span>
    <hr class="mdc-list-divider">
    `;

  return todoListItem;
}

function setToInProgress(todoText) {
  const todoRef = db.collection('todos').doc(selectedCollection);
  todoRef.get().then(doc => {
    const todos = doc.data().todos;
    const todoToMark = todos.find(todo => todo.text === todoText)
    if (!todoToMark) {
      return;
    }
    todoToMark.inProgress = !todoToMark.inProgress;
    todoRef.update({ todos });
  });
}

function markTodoAsDone(checkbox, todoText) {
  const todoRef = db.collection('todos').doc(selectedCollection);
  todoRef.get().then(doc => {
    const todos = doc.data().todos;
    const todoToMark = todos.find(todo => todo.text === todoText)
    if (!todoToMark) {
      return;
    }
    todoToMark.done = checkbox.checked;
    todoToMark.inProgress = false;
    todoRef.update({ todos });
  });
}

function loadTodosByCollectionName(collectionName) {
  db.collection('todos').doc(collectionName).onSnapshot((result) => {
    const todoList = document.getElementById('todo-list');
    removeChildren(todoList);
    result.data().todos.forEach((todo, index) => todoList.appendChild(createTodoListItem(todo, index)));
  })
}

function addTodo(form) {
  const todoText = form.todoText.value;
  form.reset();
  db.collection('todos').doc(selectedCollection).update({
    todos: firebase.firestore.FieldValue.arrayUnion({
      text: todoText,
      inProgress: false,
      done: false,
    })
  });
}

function removeTodo(todoText) {
  const todoRef = db.collection('todos').doc(selectedCollection);
  todoRef.get().then(doc => todoRef.update({
    todos: doc.data().todos.filter(todo => todo.text !== todoText)
  }));
}

function addList(form) {
  const listName = form.listName.value;
  db.collection('todos').doc(listName).set({
    todos: [],
  }).then(() => {
    dialog.close();
  });
}