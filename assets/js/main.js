var chatHistories = {}
var firebaseDatabase = firebase.database()
var firebaseStorage = firebase.storage();
var user = {}
var currentChat = ''
var shareUrl = ''
var deleteImagePath = ''
var currentPath = ''
$(document).ready(function() {
    loadDashboard()
    $('#chat').hide()

    $('.showBack').click(function () {
        var path = $(this).attr('data-path')
        openFolder(path.substr(0, path.lastIndexOf('/')))
    })
})

function getChatHistories() {
    const dbRef = firebaseDatabase.ref('webchat').child(localStorage.getItem('clientId'));
    dbRef.once('value').then(function(snapshot) {
        if(!snapshot.val()) {
            logout()
        } else {
            firebaseDatabase.ref('chathistories').child(snapshot.val()).once('value').then(
                function(snapshot) {
                    chatHistories = snapshot.val()
                    loadChatHistories(true)
                }
            )
        }
    });
}

function loadChatHistories(showGroupChat) {
    var list = ''

    if(showGroupChat) {
        list += '<li class="list-group-item border-right-0 bg-light px-5" onclick="loadGroupMessages(this)">'
        list += '<h5>Group Chat</h5>'
        list += '</li>'
    }
    
    console.log(chatHistories)
    Object.keys(chatHistories).forEach(chatKey => {
        var chat = chatHistories[chatKey]
        var uid = (chat.uid) ? chat.uid : chatKey
        list += '<li class="list-group-item border-right-0 bg-light px-5" onclick="loadMessages(\''+uid+'\', this)">'
        list += '<h5>'+chat.name+'</h5>'
        list += chat.email
        list += '</li>'
    });

    $('#chatHistory').html(list)
}

function logout() {
    localStorage.clear()
    window.location.href = '/'
}

function loadGroupMessages(elementRef) {
    $('.list-group-item ').each(function() {
        $(this).addClass('bg-light')
        $(this).removeClass('active')
    })
    $(elementRef).removeClass('bg-light')
    $(elementRef).addClass('active')

    const dbRef = firebaseDatabase.ref('webchat').child(localStorage.getItem('clientId'));
    dbRef.once('value').then(function(snapshot) {
        if(!snapshot.val()) {
            logout()
        } else {
            firebaseDatabase.ref('Users').child(snapshot.val()).on('value', function(userSnapshot) {
                user = userSnapshot.val()
                $('#messageBody').html('')
                firebaseDatabase.ref('groupmsg')
                    .on('child_added', function(msgSnapshot) {
                        var message = msgSnapshot.val()
                        var messageBox = '<div class="talk-bubble rounded'
                        if(user.name == message.name) {
                            messageBox += ' bg-info float-right'
                        } else {
                            messageBox += ' bg-primary'
                        }
                        messageBox += '"><div class="talktext">'
                        if(user.name == message.name) {
                            messageBox += '<div class="my-1">You: <span class="float-right cursor-pointer" onclick="deleteMessage(\'G\', \'\',\''+msgSnapshot.key+'\')">Delete</span></div>'
                        } else {
                            messageBox += '<p class="my-1">'+message.name+':</p>'
                        }
                        messageBox += '<p class="my-1">'+message.message+'</p>'
                        messageBox += '</div>'
                        messageBox += '</div>'

                        $('#messageBody').append(messageBox)
                    })
                firebaseDatabase.ref('groupmsg')
                    .on('child_removed', function(msgSnapshot) {
                        loadGroupMessages(elementRef)
                    })
            })
        }
    });
}

function loadMessages(chatuid, elementRef) {
    $('.list-group-item ').each(function() {
        $(this).addClass('bg-light')
        $(this).removeClass('active')
    })
    $(elementRef).removeClass('bg-light')
    $(elementRef).addClass('active')
    const dbRef = firebaseDatabase.ref('webchat').child(localStorage.getItem('clientId'));
    dbRef.once('value').then(function(snapshot) {
        if(!snapshot.val()) {
            logout()
        } else {
            firebaseDatabase.ref('Users').child(snapshot.val()).on('value', function(userSnapshot) {
                user = userSnapshot.val()
                $('#messageBody').html('')
                firebaseDatabase.ref('privatemessage').child(getChatKey(snapshot.val(), chatuid))
                    .on('child_added', function(msgSnapshot) {
                        var message = msgSnapshot.val()
                        var messageBox = '<div class="talk-bubble rounded'
                        if(user.name == message.name) {
                            messageBox += ' bg-info float-right'
                        } else {
                            messageBox += ' bg-primary'
                        }
                        messageBox += '"><div class="talktext">'
                        if(user.name == message.name) {
                            messageBox += '<p class="my-1">You: <span class="float-right cursor-pointer" onclick="deleteMessage(\'P\', \''+getChatKey(snapshot.val(), chatuid)+'\', \''+msgSnapshot.key+'\')">Delete</span></p>'
                        } else {
                            messageBox += '<p class="my-1">'+message.name+':</p>'
                        }
                        if(message.message.indexOf('https:') == 0) {
                            messageBox += '<p class="my-1 text-center"><img src="'+message.message+'" class="img-thumbnail" alt="File"/></p>'
                        } else {
                            messageBox += '<p class="my-1">'+message.message+'</p>'
                        }
                        messageBox += '</div>'
                        messageBox += '</div>'

                        $('#messageBody').append(messageBox)
                    })
                firebaseDatabase.ref('privatemessage').child(getChatKey(snapshot.val(), chatuid))
                    .on('child_removed', function(msgSnapshot) {
                        loadMessages(chatuid, elementRef)
                    })
            })
        }
    });
}

function sendMessage() {
    if(currentChat == '') {
        firebaseDatabase.ref('groupmsg').push().set({
            name: user.name,
            message: $('#message').val()
        })
    } else {
        firebaseDatabase.ref('privatemessage').child(currentChat).push().set({
            name: user.name,
            message: $('#message').val()
        })
    }
    $('#message').val('')
}

function getChatKey(uid1, uid2) {
    if (uid1.localeCompare(uid2) > 0) {
        currentChat = uid1 + uid2
        return currentChat;
    } else {
        currentChat = uid2 + uid1
        return currentChat;
    }
}

function loadContacts(elementRef) {
    $('#chats').show()
    $('#storageBlock').hide()
    if(elementRef) activateNavItem(elementRef)

    if(shareUrl != '') {
        $('#message').val(shareUrl)
        shareUrl = ''
    }

    const dbRef = firebaseDatabase.ref('webchat').child(localStorage.getItem('clientId'));
    dbRef.once('value').then(function(snapshot) {
        if(!snapshot.val()) {
            logout()
        } else {
            firebaseDatabase.ref('Users').once('value').then(
                function(snapshot) {
                    chatHistories = snapshot.val()
                    loadChatHistories(false)
                }
            )
        }
    });
}

function loadChats(elementRef) {
    activateNavItem(elementRef)
    getChatHistories()
    $('#chats').show()
    $('#storageBlock').hide()
}

function activateNavItem(elementRef) {
    $('.nav-item').each(function() {
        $(this).removeClass('active')
    })
    $(elementRef).parent().addClass('active')
}

function getFilesInStorage(folderPath) {
    console.log("Folder Path", folderPath)
    $('#storage').html('')
    const dbRef = firebaseDatabase.ref('webchat').child(localStorage.getItem('clientId'));
    dbRef.once('value').then(function(snapshot) {
        if(!snapshot.val()) {
            logout()
        } else {
            folderPath = (folderPath) ? folderPath : snapshot.val()
            $('.showBack').attr('data-path', folderPath)
            currentPath = folderPath

            firebaseStorage.ref().child(folderPath).listAll().then(function(res) {
                res.prefixes.forEach(function(folderRef) {
                    console.log(folderRef)
                    var thumbnail = '<div class="col-md-3 text-center h-100 mt-3">'
                        thumbnail += '<div class="card">'
                        thumbnail += '<div class="card-header">'+folderRef.fullPath.substr(folderRef.fullPath.lastIndexOf('/') + 1)+'</div>'
                        thumbnail += '<img src="/assets/img/folder.png" class="img-thumbnail" alt="File"/>'
                        thumbnail += '<div class="card-body text-center">'
                        thumbnail += '<a href="#" class="card-link" onclick="openFolder(\''+folderRef.fullPath+'\')" >Open</a>'
                        // thumbnail += '<a href="#" class="card-link" data-toggle="modal" data-target="#deleteImage" onclick="deleteImg(\''+folderRef.fullPath+'\')">Delete</a>'
                        thumbnail += '</div></div></div>'

                        $('#storage').append(thumbnail)
                })
                res.items.forEach(function(itemRef) {
                    itemRef.getDownloadURL().then((url) => {
                        var thumbnail = '<div class="col-md-3 text-center h-100 mt-3">'
                        thumbnail += '<div class="card">'
                        thumbnail += '<div class="card-header">'+itemRef.fullPath.substr(itemRef.fullPath.lastIndexOf('/') + 1)+'</div>'
                        thumbnail += '<img src="'+url+'" class="img-thumbnail" alt="File"/>'
                        thumbnail += '<div class="card-body text-center">'
                        thumbnail += '<a href="#" class="card-link" onclick="shareImage(\''+url+'\')" >Share</a>'
                        thumbnail += '<a href="#" class="card-link" data-toggle="modal" data-target="#deleteImage" onclick="deleteImg(\''+itemRef.fullPath+'\')">Delete</a>'
                        thumbnail += '</div></div></div>'

                        $('#storage').append(thumbnail)
                    })
                });
            }).catch(function(error) {
                console.log(error)
            });
              
        }
    });
}

function openFolder(folderPath) {
    console.log(folderPath)
    currentPath = folderPath
    if(folderPath.indexOf('/') == -1) {
        $('.showBack').hide()
    } else {
        $('.showBack').show()
    }

    getFilesInStorage(folderPath)
}

function loadDashboard(elementRef) {
    if(elementRef) {
        activateNavItem(elementRef)
    }
    
    $('.showBack').hide()
    getFilesInStorage()
    $('#storageBlock').show()
    $('#chats').hide()
}

function uploadFileInNewFolder() {
    uploadFile($('#folderName').val())
}

function uploadFile(newFolderPath) {
    const dbRef = firebaseDatabase.ref('webchat').child(localStorage.getItem('clientId'));
    dbRef.once('value').then(function(snapshot) {
        if(!snapshot.val()) {
            logout()
        } else {
            var file    = document.querySelector('input[type=file]').files[0];
            var reader  = new FileReader();
            
            var filePath = (newFolderPath) ? (currentPath + '/' + newFolderPath) : currentPath

            var storageRef = firebase.storage().ref().child(filePath+"/"+new Date().getTime());

              
            reader.addEventListener("load", function () {
                storageRef.putString(reader.result, 'data_url').then(function(snapshot) {
                    console.log(snapshot)
                    console.log('Uploaded a data_url string!');
                    $('#uploadImage').modal('hide')
                    openFolder(filePath)
                });
            }, false);
        
            if (file) {
                reader.readAsDataURL(file);
            }
              
        }
    });
}

function shareImage(url) {
    shareUrl = url
    loadContacts()
}

function deleteImg(path) {
    deleteImagePath = path
}

function confirmDelete() {
    var delRef = firebase.storage().ref().child(deleteImagePath);

    delRef.delete().then(function() {
        $('#deleteImage').modal('hide')
        getFilesInStorage()
    }).catch(function(error) {
        $('#deleteImage').modal('hide')
    });
}
  
function deleteMessage(type, parent, ref) {
    if(type == 'P') {
        firebaseDatabase.ref('privatemessage').child(parent+'/'+ref).remove();
    } else {
        firebaseDatabase.ref('groupmsg').child(ref).remove();
    }

}