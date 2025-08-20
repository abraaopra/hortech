import React, { useState, useEffect } from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Button,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { Card, Avatar, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import MaskInput from 'react-native-mask-input';

import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';


const CATALOG_DATA = [/*...Seus dados do catálogo aqui...*/];
const PESTS_DATA = [/*...Seus dados de pragas aqui...*/];

const PlantDetailScreen = ({ plant, onClose }) => ( <View style={styles.pageContainer}><View style={styles.catalogHeader}><Text style={styles.pageTitle} numberOfLines={1}>{plant.name}</Text><Button title="Voltar" onPress={onClose} color="#388E3C"/></View><ScrollView><Card style={styles.detailCard}><Image source={{ uri: plant.image }} style={styles.detailImage} /><Card.Content style={styles.detailContent}><Text style={styles.catalogScientificName}>{plant.scientificName}</Text><Text style={styles.catalogDescription}>{plant.description}</Text></Card.Content><View style={styles.detailInfoContainer}><View style={styles.infoItem}><Text style={styles.infoIcon}>🕒</Text><Text style={styles.infoLabel}>Colheita em</Text><Text style={styles.infoValue}>{plant.harvestTime}</Text></View><View style={styles.infoItem}><Text style={styles.infoIcon}>🗓️</Text><Text style={styles.infoLabel}>Plantar na</Text><Text style={styles.infoValue}>{plant.plantingSeason}</Text></View></View><Card.Content style={styles.detailTipsSection}><Text style={styles.tipTitle}>Dicas de Cultivo</Text>{plant.tips.map((tip, index) => (<View key={index} style={styles.tipListItem}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipContent}>{tip}</Text></View>))}</Card.Content></Card></ScrollView></View>);
const PestsScreen = ({ onClose }) => ( <View style={styles.pageContainer}><View style={styles.catalogHeader}><Text style={styles.pageTitle}>Pragas Comuns</Text><Button title="Voltar" onPress={onClose} color="#388E3C"/></View><FlatList data={PESTS_DATA} keyExtractor={(item) => item.id} renderItem={({ item }) => (<Card style={styles.pestCard}><Image source={{ uri: item.image }} style={styles.pestImage} /><Card.Content style={{paddingTop: 12}}><Text style={styles.pestName}>{item.name}</Text><Text style={styles.pestDescription}>{item.description}</Text><Text style={styles.pestSectionTitle}>Sintomas:</Text><Text style={styles.pestContent}>{item.symptoms}</Text><Text style={styles.pestSectionTitle}>Solução Orgânica:</Text><Text style={styles.pestSolutionText}>{item.solution}</Text></Card.Content></Card>)}/></View>);
const CatalogScreen = ({ onClose, onSelectPlant }) => (<View style={styles.pageContainer}><View style={styles.catalogHeader}><Text style={styles.pageTitle}>Catálogo de Plantas</Text><Button title="Voltar" onPress={onClose} color="#388E3C"/></View><FlatList data={CATALOG_DATA} keyExtractor={(item) => item.id} renderItem={({ item }) => (<TouchableOpacity onPress={() => onSelectPlant(item)}><Card style={styles.catalogCard}><Image source={{ uri: item.image }} style={styles.catalogImage} /><Card.Content style={styles.catalogContent}><Text style={styles.catalogPlantName}>{item.name}</Text><Text style={styles.catalogDescription} numberOfLines={2}>{item.description}</Text></Card.Content></Card></TouchableOpacity>)}/></View>);
const ChatScreen=()=>(<View style={styles.pageContainer}><Text style={styles.pageTitle}>Chat com Especialista</Text></View>);
const ProfileScreen=()=>(<View style={styles.pageContainer}><Text style={styles.pageTitle}>Perfil do Usuário</Text></View>);

const HomeScreen = ({ gardenName, setGardenName, plants, onAddPlant, onRemovePlant, onShowCatalog, onShowPests }) => {
  const [modalVisible,setModalVisible]=useState(false);const [plantName,setPlantName]=useState('');const [plantDate,setPlantDate]=useState('');const [plantImage,setPlantImage]=useState(null);const [isPlantPickerVisible, setPlantPickerVisible]=useState(false);
  const handleChooseFromGallery=async()=>{const{status}=await ImagePicker.requestMediaLibraryPermissionsAsync();if(status!=='granted'){Alert.alert('Permissão necessária');return}let r=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,allowsEditing:true,aspect:[1,1],quality:1});if(!r.canceled){setPlantImage(r.assets[0].uri)}};
  const handleTakePhoto=async()=>{const{status}=await ImagePicker.requestCameraPermissionsAsync();if(status!=='granted'){Alert.alert('Permissão necessária');return}let r=await ImagePicker.launchCameraAsync({allowsEditing:true,aspect:[1,1],quality:1});if(!r.canceled){setPlantImage(r.assets[0].uri)}};
  const handleAddPlant=()=>{const catalogPlant=CATALOG_DATA.find(p=>p.name===plantName);if(plantName.trim()&&plantDate.trim()&&catalogPlant){onAddPlant({name:plantName,date:plantDate,image:plantImage,catalogImage:catalogPlant.image});setPlantName('');setPlantDate('');setPlantImage(null);setModalVisible(false)}else{Alert.alert('Campos Incompletos','Selecione uma planta e preencha a data.')}};

  // --- NOVO CÓDIGO PARA TESTE ---
  const testFirebaseConnection = async () => {
    try {
      await addDoc(collection(db, 'test_collection'), {
        message: 'Conexão bem-sucedida!',
        timestamp: serverTimestamp() // Adiciona a hora do servidor
      });
      Alert.alert('Sucesso!', 'Os dados de teste foram enviados para o Firebase.');
    } catch (e) {
      console.error("Erro no teste de conexão: ", e);
      Alert.alert("Erro de Conexão", `Não foi possível conectar ao Firebase. Verifique suas credenciais e regras de segurança. Erro: ${e.message}`);
    }
  };
  // --- FIM DO CÓDIGO DE TESTE ---
  
  return(
    <View style={{flex:1}}><ScrollView>
      <View style={styles.headerContainer}><TextInput style={styles.gardenNameInput}value={gardenName}onChangeText={setGardenName}/></View>
      <View style={styles.plantListContainer}>{plants.length===0?(<View style={styles.emptyListContainer}><Avatar.Icon size={60}icon="emoticon-sad-outline"style={{backgroundColor:'#e0e0e0'}}/><Text style={styles.emptyListText}>Sua horta está vazia.</Text><Text style={styles.emptyListSubText}>Adicione plantas no botão '+'!</Text></View>):(plants.map((plant)=>(<Card key={plant.id}style={styles.plantListItemCard}><View style={styles.plantListItemContent}><Avatar.Image size={60}source={{uri:plant.image||plant.catalogImage}}/><View style={styles.plantListItemInfo}><Text style={styles.plantListItemName}>{plant.name}</Text><Text style={styles.plantListItemDate}>Plantado em: {plant.date}</Text></View><IconButton icon="delete-outline"size={24}iconColor="#E53935"onPress={()=>onRemovePlant(plant.id)}/></View></Card>)))}</View>

      {/* --- BOTÃO DE TESTE TEMPORÁRIO --- */}
      <TouchableOpacity style={styles.testButton} onPress={testFirebaseConnection}>
          <Text style={styles.testButtonText}>Testar Conexão com Banco de Dados</Text>
      </TouchableOpacity>
      {/* ------------------------------- */}

      <Text style={styles.sectionTitle}>Ferramentas Rápidas</Text>
      <View style={styles.featuresGrid}><TouchableOpacity style={styles.featureButton}onPress={onShowCatalog}><Text style={styles.featureText}>Catálogo</Text></TouchableOpacity><TouchableOpacity style={styles.featureButton}onPress={onShowPests}><Text style={styles.featureText}>Pragas</Text></TouchableOpacity><TouchableOpacity style={styles.featureButton}><Text style={styles.featureText}>Irrigação</Text></TouchableOpacity></View>
      <View style={{height:120}}/></ScrollView>
      <Modal animationType="slide"transparent={true}visible={modalVisible}onRequestClose={()=>{setModalVisible(false)}}><View style={styles.modalContainer}><View style={styles.modalView}><Text style={styles.modalTitle}>Adicionar Nova Planta</Text><TouchableOpacity onPress={handleChooseFromGallery}>{plantImage?<Image source={{uri:plantImage}}style={styles.imagePreview}/>:<View style={styles.imagePlaceholder}><Text>Imagem Opcional</Text></View>}</TouchableOpacity><View style={styles.imageButtonsContainer}><Button title="Tirar Foto"onPress={handleTakePhoto}color="#4CAF50"/><Button title="Galeria"onPress={handleChooseFromGallery}color="#388E3C"/></View><TouchableOpacity style={styles.pickerTrigger}onPress={()=>setPlantPickerVisible(true)}><Text style={[styles.modalInputText,!plantName&&{color:'#aaa'}]}>{plantName||"Selecione uma planta do catálogo..."}</Text></TouchableOpacity>
      <MaskInput style={styles.modalInput} value={plantDate} onChangeText={(masked)=>{setPlantDate(masked);}} mask={[/\d/,/\d/,'/',/\d/,/\d/,'/',/\d/,/\d/,/\d/,/\d/]} placeholder="Data de Plantio (DD/MM/AAAA)" keyboardType="numeric"/>
      <View style={styles.modalButtonContainer}><Button title="Cancelar"onPress={()=>{setModalVisible(false)}}color="#f44336"/><Button title="Salvar"onPress={handleAddPlant}color="#4CAF50"/></View></View></View></Modal>
      <Modal visible={isPlantPickerVisible}transparent={true}animationType="fade"onRequestClose={()=>setPlantPickerVisible(false)}><TouchableOpacity style={styles.pickerBackdrop}onPress={()=>setPlantPickerVisible(false)}><View style={styles.pickerContainer}><FlatList data={CATALOG_DATA}keyExtractor={item=>item.id}renderItem={({item})=>(<TouchableOpacity style={styles.pickerItem}onPress={()=>{setPlantName(item.name);setPlantPickerVisible(false);}}><Text style={styles.pickerItemText}>{item.name}</Text></TouchableOpacity>)}/></View></TouchableOpacity></Modal>
      <View style={styles.fabContainer}><TouchableOpacity style={styles.fab}onPress={()=>setModalVisible(true)}><Text style={styles.fabIcon}>+</Text></TouchableOpacity></View></View>
  );
};

export default function App(){
  const [activeTab,setActiveTab]=useState('Horta');const [isCatalogVisible,setCatalogVisible]=useState(false);const [selectedPlant,setSelectedPlant]=useState(null);const [isPestsVisible,setPestsVisible]=useState(false);
  const [gardenName,setGardenName]=useState('Minha Horta Escolar');
  const [plants,setPlants]=useState([]);
  useEffect(()=>{const plantsCollectionRef=collection(db,'plants');const unsubscribe=onSnapshot(plantsCollectionRef,(querySnapshot)=>{const plantsData=querySnapshot.docs.map(doc=>({...doc.data(),id:doc.id,}));setPlants(plantsData);});return()=>unsubscribe();},[]);
  const handleAddPlant=async(newPlant)=>{try{await addDoc(collection(db,'plants'),newPlant);}catch(e){console.error("Erro ao adicionar planta: ",e);Alert.alert("Erro","Não foi possível salvar a planta.");}};
  const handleRemovePlant=async(plantId)=>{try{const plantDocRef=doc(db,'plants',plantId);await deleteDoc(plantDocRef);}catch(e){console.error("Erro ao remover planta: ",e);Alert.alert("Erro","Não foi possível remover a planta.");}};
  const renderContent=()=>{if(selectedPlant){return <PlantDetailScreen plant={selectedPlant}onClose={()=>setSelectedPlant(null)}/>;}if(isPestsVisible){return <PestsScreen onClose={()=>setPestsVisible(false)}/>}if(isCatalogVisible){return <CatalogScreen onClose={()=>setCatalogVisible(false)}onSelectPlant={(plant)=>setSelectedPlant(plant)}/>;}
  switch(activeTab){case'Horta':return <HomeScreen gardenName={gardenName}setGardenName={setGardenName}plants={plants}onAddPlant={handleAddPlant}onRemovePlant={handleRemovePlant}onShowCatalog={()=>setCatalogVisible(true)}onShowPests={()=>setPestsVisible(true)}/>;case 'Chat':return <ChatScreen/>;case 'Perfil':return <ProfileScreen/>;default:return <HomeScreen gardenName={gardenName}setGardenName={setGardenName}plants={plants}onAddPlant={handleAddPlant}onRemovePlant={handleRemovePlant}onShowCatalog={()=>setCatalogVisible(true)}onShowPests={()=>setPestsVisible(true)}/>;}};
  return(<SafeAreaView style={styles.container}>{renderContent()}{!isCatalogVisible&&!selectedPlant&&!isPestsVisible&&(<View style={styles.navBar}><TouchableOpacity style={styles.navButton}onPress={()=>setActiveTab('Horta')}><Text style={[styles.navText,activeTab==='Horta'&&styles.activeNavText]}>Horta</Text></TouchableOpacity><TouchableOpacity style={styles.navButton}onPress={()=>setActiveTab('Chat')}><Text style={[styles.navText,activeTab==='Chat'&&styles.activeNavText]}>Chat</Text></TouchableOpacity><TouchableOpacity style={styles.navButton}onPress={()=>setActiveTab('Perfil')}><Text style={[styles.navText,activeTab==='Perfil'&&styles.activeNavText]}>Perfil</Text></TouchableOpacity></View>)}</SafeAreaView>);
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:'#F5F5F5'},
  homeContainer:{flex:1},
  pageContainer:{flex:1,backgroundColor:'#F5F5F5',paddingBottom:16},
  pageTitle:{fontSize:22,fontWeight:'bold',color:'#388E3C',marginBottom:8,flexShrink:1},
  headerContainer:{backgroundColor:'#fff',paddingHorizontal:20,paddingTop:10,paddingBottom:20,borderBottomLeftRadius:20,borderBottomRightRadius:20},
  gardenNameInput:{fontSize:28,fontWeight:'bold',color:'#388E3C',borderBottomWidth:1,borderBottomColor:'#E0E0E0'},
  plantListContainer:{paddingHorizontal:16,paddingTop:20},
  plantListItemCard:{marginBottom:12,borderRadius:15,backgroundColor:'#fff',elevation:2},
  plantListItemContent:{flexDirection:'row',alignItems:'center',padding:10},
  plantListItemInfo:{flex:1,marginLeft:15},
  plantListItemName:{fontSize:18,fontWeight:'600',color:'#333'},
  plantListItemDate:{fontSize:13,color:'gray'},
  emptyListContainer:{alignItems:'center',paddingVertical:50},
  emptyListText:{fontSize:18,fontWeight:'bold',color:'#757575',marginTop:16},
  emptyListSubText:{fontSize:14,color:'#9E9E9E',marginTop:4},
  
  // ESTILOS PARA O BOTÃO DE TESTE
  testButton: {
    backgroundColor: '#ff9800',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    elevation: 2,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  
  sectionTitle:{fontSize:16,fontWeight:'bold',color:'#424242',marginTop:20,marginBottom:10,marginLeft:16},
  featuresGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',paddingHorizontal:8},
  featureButton:{backgroundColor:'#FFFFFF',padding:16,borderRadius:15,alignItems:'center',justifyContent:'center',width:'45%',marginHorizontal:5,marginBottom:12,elevation:2},
  featureText:{fontSize:16,fontWeight:'600',color:'#4CAF50'},
  fabContainer:{position:'absolute',bottom:75,width:'100%',alignItems:'center'},
  fab:{backgroundColor:'#4CAF50',width:60,height:60,borderRadius:30,justifyContent:'center',alignItems:'center',elevation:8},
  fabIcon:{fontSize:34,color:'white',lineHeight:36},
  navBar:{flexDirection:'row',height:60,backgroundColor:'#ffffff',borderTopWidth:1,borderTopColor:'#e0e0e0'},
  navButton:{flex:1,justifyContent:'center',alignItems:'center'},
  navText:{fontSize:14,color:'#757575'},
  activeNavText:{color:'#388E3C',fontWeight:'bold'},
  modalContainer:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.5)'},
  modalView:{margin:20,backgroundColor:'white',borderRadius:20,padding:25,alignItems:'center',elevation:5,width:'90%'},
  modalTitle:{fontSize:18,fontWeight:'bold',marginBottom:15},
  modalInput:{width:'100%',borderWidth:1,borderColor:'#ccc',padding:12,borderRadius:10,marginBottom:15,fontSize:16},
  modalButtonContainer:{flexDirection:'row',justifyContent:'space-around',width:'100%',marginTop:20},
  imagePlaceholder:{width:120,height:120,borderRadius:60,backgroundColor:'#e0e0e0',justifyContent:'center',alignItems:'center',marginBottom:15},
  imagePreview:{width:120,height:120,borderRadius:60,marginBottom:15,borderColor:'#4CAF50',borderWidth:2},
  imageButtonsContainer:{flexDirection:'row',justifyContent:'space-evenly',width:'100%',marginBottom:20},
  catalogHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingTop:16,paddingBottom:8},
  catalogCard:{marginVertical:8,marginHorizontal:16,borderRadius:15,elevation:3,backgroundColor:'#fff'},
  catalogImage:{width:'100%',height:150,borderTopLeftRadius:15,borderTopRightRadius:15},
  catalogContent:{padding:12},
  catalogPlantName:{fontSize:18,fontWeight:'bold',color:'#388E3C'},
  catalogDescription:{fontSize:14,color:'#333',lineHeight:20},
  detailCard:{margin:16,borderRadius:15,backgroundColor:'#fff',elevation:3,marginBottom:32},
  detailImage:{width:'100%',height:200,borderTopLeftRadius:15,borderTopRightRadius:15},
  detailContent:{padding:16,paddingBottom:0},
  catalogScientificName:{fontSize:12,fontStyle:'italic',color:'gray',marginBottom:8},
  detailInfoContainer:{flexDirection:'row',justifyContent:'space-around',marginTop:16,paddingVertical:16,borderTopWidth:1,borderBottomWidth:1,borderColor:'#eee'},
  infoItem:{alignItems:'center'},infoIcon:{fontSize:24,marginBottom:8},infoLabel:{fontSize:13,color:'gray'},
  infoValue:{fontSize:16,fontWeight:'bold',color:'#333'},
  detailTipsSection:{padding:16},
  tipTitle:{fontSize:18,fontWeight:'bold',color:'#388E3C',marginBottom:12},
  tipListItem:{flexDirection:'row',marginBottom:8},
  tipBullet:{marginRight:8,fontSize:15,lineHeight:22,color:'#388E3C',fontWeight:'bold'},
  tipContent:{flex:1,fontSize:15,lineHeight:22,color:'#333'},
  pestCard:{marginVertical:8,marginHorizontal:16,borderRadius:15,elevation:3,backgroundColor:'#fff',paddingBottom:8},
  pestImage:{width:'100%',height:150,borderTopLeftRadius:15,borderTopRightRadius:15},
  pestName:{fontSize:18,fontWeight:'bold',color:'#c62828',marginBottom:4,paddingHorizontal:16},
  pestDescription:{fontSize:14,color:'#333',marginBottom:12,fontStyle:'italic',paddingHorizontal:16},
  pestSectionTitle:{fontSize:15,fontWeight:'bold',color:'#333',marginTop:8,paddingHorizontal:16},
  pestContent:{fontSize:14,color:'#424242',marginBottom:8,paddingHorizontal:16},
  pestSolutionText:{fontSize:14,color:'#388E3C',fontWeight:'500',paddingHorizontal:16},
  pickerTrigger:{width:'100%',borderWidth:1,borderColor:'#ccc',padding:12,borderRadius:10,marginBottom:15},
  modalInputText:{fontSize:16,color:'#000'},
  pickerBackdrop:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.5)'},
  pickerContainer:{backgroundColor:'white',width:'80%',maxHeight:'60%',borderRadius:10,padding:10},
  pickerItem:{paddingVertical:15,borderBottomWidth:1,borderBottomColor:'#eee'},
  pickerItemText:{fontSize:18,textAlign:'center'},
});