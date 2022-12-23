import { useEffect, useState, useLayoutEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import randomToken from "random-token";

const socket = io("http://localhost:3001");
// const socket = io("/");

// ------------------ START NEW CODE ------------------

// Conexion por axios al API
const axiosInstanceChat = axios.create({
  baseURL: 'http://localhost:3001',
});

const axiosInstanceNewUser = axios.create({
  baseURL: 'https://randomuser.me/api/',
});

// Endpoints
const getRandomById = () => {
  return axiosInstanceNewUser.get();
};

// Endpoints USER(movil) y USER ADMIN(pc)
const addMember = (data) => {
  return axiosInstanceChat.post(`/members`, data);
};

const startChannel = (data) => {
  return axiosInstanceChat.post(`/channels`, data);
};

const getMessagesByChannelId = (channelId) => {
  return axiosInstanceChat.get(`/messages/by-channel?id_channel=${channelId}`);
};

const sendMessage = (data) => {
  return axiosInstanceChat.post(`/messages`, data);
};

// Endpoints USER ADMIN(pc)
const getChatsByUserId = (userId) => {
  return axiosInstanceChat.get(`/channels/by-user?id_user=${userId}`);
};

const getActiveUsers = () => {
  return axiosInstanceChat.get(`/users/active`);
};

const reassignUser = (data) => {
  return axiosInstanceChat.post(`/channels/reassign`, data);
};

const disableMeeting = (data) => {
  return axiosInstanceChat.post(`/meetings/close-meeting`, data);
};

const setUserAvailability = (data) => {
  return axiosInstanceChat.post(`/users/change-status`, data);
};

const addUserToken = (data) => {
  return axiosInstanceChat.post(`/users`, data);
};

// Enpoints News
const getAllChannels = () => {
  return axiosInstanceChat.get(`/channels/channels`);
}

// ------------------ END NEW CODE ------------------

export default function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  
  // ------------------ START NEW CODE ------------------

  // Let y const ----------------------------------

  let tzoffset = new Date().getTimezoneOffset() * 60000;

  // const { status, startRecording, stopRecording } = useReactMediaRecorder({
  //   audio: true,
  //   // type: "audio/wav",
  //   onStop: (blobUrl, blob) => {
  //     storeAudio(blobUrl, blob);
  //   },
  // });

  // UseState ----------------------------------

  const [userId, setUserId] = useState();
  const [nameUser, setNameUser] = useState();
  const [userAdminId, setUserAdminId] = useState();
  const [nameUserAdmin, setNameUserAdmin] = useState();
  const [currentCount, setCurrentCount] = useState(0);
  const [channelList, setChannelList] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [channelHistory, setChannelHistory] = useState([]);
  const [currentChannel, setCurrentChannel] = useState();
  const [currentChannelData, setCurrentChannelData] = useState(false);
  const [reload, setReload] = useState(false);
  const [reloadChannels, setReloadChannels] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [currentTerm, setCurrentTerm] = useState("");
  const [activeChannel, setActiveChannel] = useState([]);
  const [messageList, setMessageList] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [currentLoggedUser, setCurrentLoggedUser] = useState(false);
  const [reloadAvaliableUsers, setReloadAvaliableUsers] = useState(false);
  const [showPreviewLoader, setShowPreviewLoader] = useState(false);
  const [firstNameUserAdmin, setFirstNameUserAdmin] = useState();
  const [lastNameUserAdmin, setLastNameUserAdmin] = useState();
  const [firstNameUser, setFirstNameUser] = useState();
  const [lastNameUser, setLastNameUser] = useState();
  const [tokenUser, setTokenUser] = useState();
  const [tokenUserAdmin, setTokenUserAdmin] = useState();
  const [channel, setChannel] = useState();
  const [userIdForm, setUserIdForm] = useState();
  const [userOrAdmin, setUserOrAdmin] = useState();
  


  // UseRef ----------------------------------
  const chatAreaRef = useRef(null);
  const receiveMessage = useRef(false);
  const lastMessageId = useRef(false);
  const timer = useRef(null);


  // UseLayoutEffect ----------------------------------

  // Obtener los canales de el id de usuario indicado
  useLayoutEffect(() => {
    console.log('1-> Obtener canal por id de usuario');
    const getChats = async () => {
      // console.log('1.1');
      try {
        // console.log('1.2');
        const response = await getChatsByUserId(userAdminId);
        console.log('promesa 1-> Obtener data del canal para mostrar');
        console.log(`GET /channels/by-user?id_user=${userAdminId}`);
        console.log('Data del canal = ', response);
        // console.log('getChatsByUserId = ', response);
        setChannelList(response.data.data);
        // console.log('channelList = ', channelList);
        setFilteredChannels(response.data.data);
        // console.log('filteredChannels = ', filteredChannels);
        const localChannel = localStorage.getItem("localChannel");
        // console.log('localChannel = ', localChannel);
        if (localChannel) {
          // console.log('1.3');
          setCurrentChannel(localChannel);
          // console.log('currentChannel = ', currentChannel);
          setChannelHistory((current) => [...current, localChannel]);
          // console.log('channelHistory = ', channelHistory);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (userAdminId){
      getChats();
    }else{
      console.log('Por favor selecciona uno de los usuarios para obtener la lista de canales');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, reloadChannels, userAdminId]);

  // UseEffect para Sockets----------------------------------

  // Crear token y un usuario(administrativo) en rethinkdb
  useEffect(() => {
    console.log('2-> Agregar token y usuario a rethinkdb');
    socket.connect();
    // const currentToken = localStorage.getItem("firebaseToken");
    const getUserToken = async () => {
      // console.log('2.1');
      const response = await getRandomById();
      const currentUserAdmin = response.data.results[0];
      const submitData = {
        id: currentUserAdmin.login.uuid,
        first_name: currentUserAdmin.name.first,
        last_name: currentUserAdmin.name.last,
        role_id: 39, // Rol unico de este proyecto (Chat de prueba para escritorio con el back-chat de bodytech)
        device: "pc",
        type: "web",
        id_member: null,
        token: tokenUserAdmin,
      };
      // console.log('submitData = ', submitData);
      try {
        // console.log('2.2');
        await addUserToken(submitData);
        console.log('promesa 2-> Usuario creado en rethinkdb con token');
        console.log('POST /users');
        console.log('Data del usuario(administrador) creado en rethinkdb = ', submitData);
        setUserAdminId(currentUserAdmin.login.uuid);
        setNameUserAdmin(`${submitData.first_name} ${submitData.last_name}`);
      } catch (error) {
        console.log(error);
      }
    };
    if (tokenUserAdmin){
      getUserToken();  
    }else{
      console.log('Por favor selecciona el usuario administrador para obtener el token del usuario');
    }
    return () => {
      socket.disconnect();
    };
  }, [tokenUserAdmin]);

  // Precaucion para desconectar el socket
  useEffect(() => {
    console.log('3-> ');
    if (currentCount === 10) {
      setCurrentCount(0);
      socket.disconnect();
      socket.connect();
    }
  }, [currentCount]);

  // Socket pong
  useEffect(() => {
    // console.log('4');
    socket.on("pong", () => {
      // console.log('pong (on)');
      setCurrentCount(0);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Socket service_ping
  useEffect(() => {
    console.log('5');
    setInterval(() => {
      socket.emit("service_ping", 0);
      // console.log("service_ping (emmit)");
      setCurrentCount((current) => current + 1);
    }, 2000);
  }, []);

  // Socket join_room y change_waiting
  // Unirse al canal y crear un meeting nuevo
  useEffect(() => {
    console.log('6-> unirse al canal y crear meeting');
    if (currentChannel) {
      // console.log('6.1');
      // console.log('currentChannel = ', currentChannel);
      const joinChannel = async () => {
        // console.log('6.2');
        if (channelHistory.length > 1) {
          // console.log('6.3');
          // console.log('channelHistory = ', channelHistory);
          socket.emit(
            "change_waiting",
            channelHistory[channelHistory.length - 2]
          );
          // console.log("change_waiting (emit)");
        } else {
          // console.log('6.4');
          setChannelHistory([currentChannel]);
          // console.log('channelHistory = ', channelHistory);
        }
        await socket.emit("join_room", currentChannel);
        // console.log("join_room (emit)");
        console.log('promesa 6-> Unirse al canal(chat) y crear un meeting(sesión)');
        console.log(`GET /messages/by-channel?id_channel=${currentChannel}`);
        console.log('Canal al que se ha unido = ', currentChannel);
        setCurrentChannelData(
          channelList.filter(
            (channel) => channel.id_channel == currentChannel
          )[0]
        );
        // console.log("currentChannelData = ", currentChannelData);
        localStorage.removeItem("localChannel");
        // console.log("removeItem localChannel");
        setShowUser(true);
        // console.log("showUser = ", showUser);
        setCurrentTerm("");
        // console.log('currentTerm = ', currentTerm);
      };
      joinChannel();
    }
  }, [currentChannel]);

  // Socket new_channels
  // Abrir nuevo canal
  useEffect(() => {
    console.log('7');
    socket.on("new_channels", (data) => {
      // console.log("new_channels (on)");
      if (userId == data.id_user) {
        setActiveChannel(data.id_channel);
        setReload((current) => !current);
      }
    });
  }, [socket]);

  // Socket receive_message
  // recibir mensaje
  useEffect(() => {
    console.log('8');
    socket.on("receive_message", (data) => {
      // console.log("receive_message (on)")
      // enqueueSnackbar("Socket recieved message", infoToast);
      receiveMessage.current = true;
      if (data.author !== userId && lastMessageId.current !== data.id) {
        // setReload((current) => !current);
        lastMessageId.current = data.id;
        setMessageList((list) => [...list, data]);
        // scrollToBottom();
      }
    });
  }, [socket]);

  // UseEffect ----------------------------------

  // Desactivar canal
  useEffect(() => {
    console.log('9-> desactivar canal');
    if (currentChannel == activeChannel) {
      setActiveChannel(false);
    }
  }, [activeChannel, currentChannel]);

  // Filtrar los canales
  useEffect(() => {
    console.log('10');
    if (currentTerm.length > 0) {
      const currentData = channelList.filter(
        (item) =>
          `${item.first_name} ${item.last_name}`.includes(currentTerm) ||
          item.email.includes(currentTerm)
      );
      setFilteredChannels(currentData);
    } else {
      setFilteredChannels(channelList);
    }
  }, [currentTerm]);

  // Obtener mensajes
  useEffect(() => {
    console.log('11-> obtener mensajes del canal ingresado');
    console.log('currentChannel = ', currentChannel);
    if (currentChannel) {
      const getMessages = async () => {
        try {
          const response = await getMessagesByChannelId(currentChannel);
          setMessageList(response.data.data);
          setMessage("");
          // scrollToBottom();
        } catch (error) {
          console.log(error);
        }
      };
      getMessages();
    }
  }, [currentChannel, reload]);

  // Obtener usuarios habilitados
  useEffect(() => {
    console.log('12');
    const getAvaliableUsers = async () => {
      try {
        const response = await getActiveUsers();
        setActiveUsersList(response.data.data);
        setCurrentLoggedUser(
          response.data.data.filter((user) => user.id_user == userId)[0]
        );
      } catch (error) {
        console.log(error);
      }
    };
    getAvaliableUsers();
  }, [reloadAvaliableUsers]);

  // Mostrar carga anterior
  useEffect(() => {
    console.log('13');
    if (showPreviewLoader) {
      // scrollToBottom();
      console.log('entre al 13');
    }
  }, [showPreviewLoader]);

  // Funciones ---------------------

  // Inicializa un usuario y inicializar un canal con el id del usuario administrador
  const handleJoinChatUser = async (event) => {
    event.preventDefault();
    console.log('Boton nuevo usuario handleJoinChatUser enter');
    try {
      const response = await getRandomById();
      const currentUser = response.data.results[0];
      const idUserAdmin = userIdForm;
      const submitData = {
        first_name: currentUser.name.first,
        last_name: currentUser.name.last || "",
        id: (currentUser.location.street.number * currentUser.dob.age), // id_member en rethinkdb es numerico
        photo: currentUser.picture.large || "",
        email: currentUser.email || "",
        mobile_phone: currentUser.phone || "",
        document_number: currentUser.id.value || "",
        id_service_line: 5501,
        id_user: idUserAdmin,
      };
      try {
        await addMember(submitData);
        console.log('1) Creado nuevo usuario');
        console.log('POST /members');
        console.log('Data de usuario nuevo = ', submitData);
        const responseChannel = await startChannel({
          id: submitData.id,
          id_service_line: 5501,
          id_user: idUserAdmin,
        });
        console.log('2) Creado canal nuevo');
        console.log('POST /channels');
        console.log('Data de canal nuevo', responseChannel);
        if (responseChannel.data.id_channel) {
          localStorage.setItem("localChannel", responseChannel.data.id_channel);
          setNameUser(`${submitData.first_name} ${submitData.last_name}`);
          setFirstNameUser(submitData.first_name);
          setLastNameUser(submitData.last_name);
          setUserId(submitData.id);
          setUserAdminId(idUserAdmin);
          setUserOrAdmin('User');
          // history.push("/chat");
        }
      } catch (err) {
        console.log(err);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Inicializa un usuario(administrativo)
  const handleJoinChatUserAdmin = async () => {
    console.log('Boton nuevo usuario (administrador) handleJoinChatUserAdmin enter');
    const currentToken = randomToken(16);
    try {
      setTokenUserAdmin(currentToken);
      setUserOrAdmin('Admin');
    } catch (error) {
      console.log(error);
    }
  };

  // Scroll hacia abajo
  const scrollToBottom = () => {
    chatAreaRef?.current?.scrollTo(0, chatAreaRef?.current?.scrollHeight);
  };

  // Asignar nuevo usuario
  const assignNewUser = async (newUserId) => {
    const submitData = {
      id_user: newUserId.toString(),
      id_channel: currentChannel,
    };
    try {
      await reassignUser(submitData);
      setReloadChannels((current) => !current);
      setShowUser((current) => !current);
      setCurrentChannel(false);
      // enqueueSnackbar("Chat reasignado", infoToast);
    } catch (error) {
      console.log(error);
    }
  };

  // Almacenamiento de mensajes
  const storeMessage = async (event) => {
    event.preventDefault();
    if (message) {
      const messageData = {
        id_channel: currentChannel,
        author: userOrAdmin === 'Admin' ? userAdminId : userId,
        content: message,
        type: "text",
        author_type: "back", // este author_type (back) es para que no entre en notificaciones por el lado del API y no de error porque no estamos en un dispositivo movil
        author_name: userOrAdmin === 'Admin' ? nameUserAdmin : nameUser,
        create_at: new Date(Date.now() - tzoffset).toISOString().slice(0, -1),
      };
      try {
        await sendMessage(messageData);
        console.log("3) envio de mensaje para guardar en base de datos y mostrar en pantalla");
        console.log("POST /messages");
        console.log("La data del mensaje es = ", messageData);
        const localDate = new Date();
        messageData["create_at"] = localDate.toISOString();
        setMessageList((list) => [...list, messageData]);
        timer.current = setTimeout(async () => {
          if (!receiveMessage.current) {
            socket.emit("reactive_changefeed", currentChannel);
            console.log("reactive_changefeed (emit)");
            try {
              const response = await getMessagesByChannelId(currentChannel);
              console.log('getMessagesByChannelId = ', response);
              setMessageList(response.data.data);
              console.log('messageList = ', messageList);
              setMessage("");
              console.log('message = ', message);
              // scrollToBottom();
            } catch (error) {
              console.log(error);
            }
          }
          receiveMessage.current = false;
        }, 3000);
        setMessage("");
        // scrollToBottom();
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Almacenamiento de audio
  const storeAudio = async (blobUrl, blob) => {
    if (blob) {
      const file = new File([blob], { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("author", userId);
      formData.append("content", "");
      formData.append("id_channel", currentChannel);
      formData.append("type", "audio");
      formData.append("author_type", "user");
      formData.append("author_name", nameUser);
      formData.append(
        "create_at",
        new Date(Date.now() - tzoffset).toISOString().slice(0, -1)
      );
      try {
        await sendMessage(formData);
        setReload((current) => !current);
        setMessage("");
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Cerrar metting
  const closeMetting = async () => {
    try {
      const response = await disableMeeting({ id_channel: currentChannel });
      if (response.data.status === 200) {
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Alternar disponibilidad del usuario
  const toggleUserAvailability = async (status) => {
    const submitData = {
      id_user: userId.toString(),
      status: status === "active" ? "inactive" : "active",
    };
    try {
      await setUserAvailability(submitData);
      setReloadAvaliableUsers((current) => !current);
    } catch (error) {
      console.log(error);
    }
  };

  const listChannels = async () => {
    try {
      const response = await getAllChannels();
      setChannelList(response.data.data)
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  }

  // Asignar canal al usuario
  const assignChannel = async (event) => {
    event.preventDefault();
    if (channel){
      try {
          console.log(channel);
          setCurrentChannel(channel);
          console.log('2) Asignando canal seleccionado');
      } catch (error) {
        console.log(error);
      }
    }
  }

  // ------------------ END NEW CODE ------------------

  useEffect(() => {
    const receiveMessage = (message) => {
      setMessages([message, ...messages]);
    };

    socket.on("message", receiveMessage);

    return () => {
      socket.off("message", receiveMessage);
    };
  }, [messages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const newMessage = {
      body: message,
      from: "Me",
    };
    setMessages([newMessage, ...messages]);
    setMessage("");
    socket.emit("message", newMessage.body);
  };

  return (
    <>
      <div className="bg-zinc-800 text-white flex items-center justify-center" style={{flexDirection: "column"}}>
        <div className="bg-zinc-900 p-10" style={{display: "flex", "flexDirection": "column", margin: "1%", width: "50%"}}>
          <p style={{textAlign: "center", margin: "1%"}}>
            1) Escoja el usuario que va ha chatear
          </p>
          <div style={{display: "flex", "flexDirection": "row", alignItems: "center", justifyContent: "space-between", margin: "1%"}}>
            <button style={{"minWidth": "130px",
                            "height": "40px",
                            "color": "#fff",
                            "padding": "5px 10px",
                            "fontWeight": "bold",
                            "cursor": "pointer",
                            "transition": "all 0.3s ease",
                            "position": "relative",
                            "display": "inline-block",
                            "outline": "none",
                            "borderRadius": "5px",
                            "border": "none",
                            "background": "#3d348b",
                            "boxShadow": "0 5px #2c0b8e"
            }}type="button" onClick={handleJoinChatUserAdmin}>
              Usuario Administrativo
            </button>
            <form onSubmit={handleJoinChatUser} className="bg-zinc-900 p-10" style={{margin: "1%", display: "flex", flexDirection: "column"}}>
              <input
                name="userId"
                type="text"
                placeholder="Escribe un userId o Bot..."
                onChange={(e) => setUserIdForm(e.target.value)}
                className="border-2 border-zinc-500 p-2 w-full text-black"
                value={userIdForm || ''}
                autoFocus
                style={{marginBottom: "5px"}}
              />
              <button style={{"minWidth": "130px",
                              "height": "40px",
                              "color": "#fff",
                              "padding": "5px 10px",
                              "fontWeight": "bold",
                              "cursor": "pointer",
                              "transition": "all 0.3s ease",
                              "position": "relative",
                              "display": "inline-block",
                              "outline": "none",
                              "borderRadius": "5px",
                              "border": "none",
                              "background": "#3d348b",
                              "boxShadow": "0 5px #2c0b8e"
              }}type="submit">
                Usuario
              </button>
            </form>
          </div>
        </div>
        <div className="bg-zinc-900 p-10" style={{display: "flex", "flexDirection": "column", margin: "1%"}}>
          <p style={{textAlign: "center", margin: "1%"}}>
            Usuario
          </p>
          <p>
            <b style={{color: "grey"}}>Nombre:</b> {nameUser}
          </p>
          <p>
            <b style={{color: "grey"}}>Id user:</b> {userId}
          </p>
          <p style={{textAlign: "center", margin: "1%"}}>
            Usuario administrativo
          </p>
          <p>
            <b style={{color: "grey"}}>Nombre:</b> {nameUserAdmin}
          </p>
          <p>
            <b style={{color: "grey"}}>Id user admin:</b> {userAdminId}
          </p>
        </div>

        <div className="bg-zinc-900 p-10" style={{display: "flex", "flexDirection": "column", margin: "1%"}}>
          <p style={{textAlign: "center"}}>
            Canales del usuario administrador
          </p>
          <form onSubmit={assignChannel} className="bg-zinc-900 p-10" style={{margin: "1%"}}>
            <input
              name="channel"
              type="text"
              placeholder="Write the channel ..."
              onChange={(e) => setChannel(e.target.value)}
              className="border-2 border-zinc-500 p-2 w-full text-black"
              value={channel || ''}
              autoFocus
            />
          </form>
          <ul className="overflow-y-auto">
            {channelList.map((item, index) => (
              <li key={index} className={`my-2 p-2 table rounded-md "bg-black"}`}>
                <b style={{color: "grey"}}>Id channel: </b> {item.id_channel}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={storeMessage} className="bg-zinc-900 p-10" style={{margin: "1%"}}>
          <h1 className="text-2xl font-bold my-2">Chat</h1>
          <input
            name="message"
            type="text"
            placeholder="Write your message..."
            onChange={(e) => setMessage(e.target.value)}
            className="border-2 border-zinc-500 p-2 w-full text-black"
            value={message}
            autoFocus
          />

          { userOrAdmin === 'Admin' 
            ?
            <ul className="h-80 overflow-y-auto">
              {messageList.map((message, index) => (
                <li
                  key={index}
                  className={`my-2 p-2 table text-sm rounded-md ${
                    message.author === userAdminId ? "bg-sky-700 ml-auto" : "bg-black"
                  }`}
                >
                  <b>{message.author_name}</b> : {message.content}
                </li>
              ))}
            </ul> 
            :
            <ul className="h-80 overflow-y-auto">
              {messageList.map((message, index) => (
                <li
                  key={index}
                  className={`my-2 p-2 table text-sm rounded-md ${
                    message.author === userId ? "bg-sky-700 ml-auto" : "bg-black"
                  }`}
                >
                  <b>{message.author_name}</b> : {message.content}
                </li>
              ))}
            </ul>
          }
        </form>

      </div>
    </>
  );
}
