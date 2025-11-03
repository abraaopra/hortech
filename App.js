import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

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
  ActivityIndicator,
} from 'react-native';
import { Card, Avatar, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import MaskInput from 'react-native-mask-input';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { supabase } from './supabaseClient';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// =================================================================
// 🚀 INÍCIO DOS COMPONENTES DE NAVEGAÇÃO 🚀
// =================================================================

const AppHeader = ({ navigation, title, showBackButton = false, isDrawer = false }) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerSide}>
                {showBackButton ? (
                    <IconButton icon="arrow-left" iconColor="#388E3C" size={28} onPress={() => navigation.goBack()} />
                ) : isDrawer ? (
                    <IconButton icon="menu" iconColor="#388E3C" size={28} onPress={() => navigation.openDrawer()} />
                ) : null}
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <View style={styles.headerSide} />
        </View>
    );
};

const CustomDrawerContent = (props) => {
    const [userEmail, setUserEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email);
                const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
                if (profile) {
                    setAvatarUrl(profile.avatar_url);
                }
            }
        };
        fetchUserData();

        const channel = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUserData).subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <DrawerContentScrollView {...props}>
            <View style={styles.drawerHeader}>
                {avatarUrl ? <Avatar.Image size={64} source={{ uri: avatarUrl }} /> : <Avatar.Icon size={64} icon="account-circle" style={{ backgroundColor: '#ccc' }} />}
                <Text style={styles.drawerEmail} numberOfLines={1}>{userEmail}</Text>
            </View>
            <DrawerItemList {...props} />
            <TouchableOpacity style={styles.drawerSignOutButton} onPress={() => supabase.auth.signOut()}>
                <Text style={styles.drawerSignOutText}>Sair da Conta</Text>
            </TouchableOpacity>
        </DrawerContentScrollView>
    );
};

// =================================================================
// 🚀 INÍCIO DOS COMPONENTES DE TELA 🚀
// =================================================================

const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    async function signInWithEmail() { setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) Alert.alert('Erro no Login', error.message); setLoading(false); }
    async function signUpWithEmail() { setLoading(true); const { data, error } = await supabase.auth.signUp({ email, password }); if (error) { Alert.alert('Erro no Cadastro', error.message); } else if (data.session) { Alert.alert('Cadastro realizado com sucesso!', 'Você já está conectado.'); } setLoading(false); }
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hortech App</Text>
            <TextInput style={styles.authInput} onChangeText={setEmail} value={email} placeholder="email@endereco.com" autoCapitalize="none" keyboardType="email-address"/>
            <TextInput style={styles.authInput} onChangeText={setPassword} value={password} secureTextEntry placeholder="Senha" autoCapitalize="none"/>
            <TouchableOpacity style={[styles.button, styles.signInButton]} disabled={loading} onPress={signInWithEmail}>
                <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.signUpButton]} disabled={loading} onPress={signUpWithEmail}>
                <Text style={styles.buttonText}>Criar Conta</Text>
            </TouchableOpacity>
        </View>
    );
};

const AccountScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => { const fetchProfile = async () => { setLoading(true); const { data: { user } } = await supabase.auth.getUser(); setUser(user); if (user) { const { data, error } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single(); if (error && error.code !== 'PGRST116') { console.log('Erro ao buscar perfil:', error.message); } if (data) { setAvatarUrl(data.avatar_url); } } setLoading(false); }; fetchProfile(); }, []);
    
    const askToUpdateAvatar = () => Alert.alert("Trocar Foto de Perfil", "Escolha uma opção", [{ text: "Tirar Foto...", onPress: () => updateAvatar('camera') }, { text: "Escolher da Galeria...", onPress: () => updateAvatar('gallery') }, { text: "Cancelar", style: "cancel" }]);
    const updateAvatar = async (type) => { let result; try { if (type === 'camera') { await ImagePicker.requestCameraPermissionsAsync(); result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 }); } else { await ImagePicker.requestMediaLibraryPermissionsAsync(); result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 }); } if (result.canceled || !result.assets || result.assets.length === 0) return; const image = result.assets[0]; setUploading(true); const filePath = `${user.id}/${Date.now()}`; const response = await fetch(image.uri); const blob = await response.blob(); const file = new File([blob], 'profile.jpg', { type: image.mimeType }); const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true }); if (uploadError) throw uploadError; const { data: { publicUrl }, error: urlError } = supabase.storage.from('avatars').getPublicUrl(filePath); if (urlError) throw urlError; const { error: updateError } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date() }); if (updateError) throw updateError; setAvatarUrl(publicUrl); } catch (error) { Alert.alert('Erro', error.message || 'Ocorreu um erro ao atualizar a foto.'); } finally { setUploading(false); } };

    if (loading) return (<SafeAreaView style={styles.containerFull}><AppHeader title="Minha Conta" navigation={navigation} showBackButton={true} /><View style={styles.container}><ActivityIndicator /></View></SafeAreaView>);
    
    return (
        <SafeAreaView style={styles.containerFull}>
            <AppHeader title="Minha Conta" navigation={navigation} showBackButton={true} />
            <View style={styles.pageContent}>
                <TouchableOpacity onPress={askToUpdateAvatar} disabled={uploading}>
                    {avatarUrl ? <Avatar.Image size={100} source={{ uri: avatarUrl }} style={styles.accountAvatar} /> : <Avatar.Icon size={100} icon="account-circle" style={styles.accountAvatar} />}
                    {uploading && <View style={styles.avatarUploadingOverlay}><ActivityIndicator color="#fff" /></View>}
                </TouchableOpacity>
                <Text style={styles.accountLabel}>E-mail da Conta</Text>
                <Text style={styles.accountEmail}>{user ? user.email : ''}</Text>
            </View>
        </SafeAreaView>
    );
};

const GardenListScreen = ({ navigation }) => {
    const [gardens, setGardens] = useState([]);
    const [newGardenName, setNewGardenName] = useState('');
    const [loading, setLoading] = useState(true);

    async function fetchGardens() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase.from('gardens').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            if (error) { Alert.alert('Erro', error.message); }
            else { setGardens(data || []); }
        }
        setLoading(false);
    }

    useEffect(() => { const unsubscribe = navigation.addListener('focus', () => fetchGardens()); return unsubscribe; }, [navigation]);
    
    const handleCreateGarden = async () => {
        if (!newGardenName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: newGarden, error } = await supabase.from('gardens').insert([{ name: newGardenName, user_id: user.id }]).select().single();
            if (error) { Alert.alert('Erro ao criar horta', error.message); }
            else if (newGarden) {
                setGardens(currentGardens => [newGarden, ...currentGardens]);
                setNewGardenName('');
            }
        }
    };
    
    const handleDeleteGarden = (gardenId) => { Alert.alert("Apagar Horta", "Tem certeza? Todas as plantas serão removidas.", [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: async () => { const { error } = await supabase.from('gardens').delete().eq('id', gardenId); if (error) { Alert.alert('Erro ao apagar horta', error.message); } else { setGardens(currentGardens => currentGardens.filter(garden => garden.id !== gardenId)); } } }]); };
    
    return (
        <SafeAreaView style={styles.containerFull}>
            <AppHeader title="Minhas Hortas" navigation={navigation} isDrawer={true} />
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Nome da nova horta" value={newGardenName} onChangeText={setNewGardenName} />
                <TouchableOpacity style={styles.createButton} onPress={handleCreateGarden}>
                    <Text style={styles.createButtonText}>CRIAR</Text>
                </TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator style={{marginTop: 50}} /> : (
                <FlatList
                    data={gardens}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.gardenItem} onPress={() => navigation.navigate('Garden', { gardenId: item.id, gardenName: item.name })}>
                            <Text style={styles.gardenName}>{item.name}</Text>
                            <IconButton icon="delete-outline" size={24} iconColor="#E53935" onPress={() => handleDeleteGarden(item.id)} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não tem hortas. Crie uma acima!</Text>}
                />
            )}
        </SafeAreaView>
    );
};

const GardenScreen = ({ route, navigation }) => {
    const { gardenId, gardenName } = route.params;
    const [plants, setPlants] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [pests, setPests] = useState([]);
    const [isCatalogVisible, setIsCatalogVisible] = useState(false);
    const [isPestsVisible, setIsPestsVisible] = useState(false);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [plantName, setPlantName] = useState('');
    const [plantDate, setPlantDate] = useState('');
    const [plantImageURI, setPlantImageURI] = useState(null);
    const [isPlantPickerVisible, setPlantPickerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [irrigationStatus, setIrrigationStatus] = useState('off');

    useEffect(() => {
        async function fetchInitialData() {
            const { data: catalogData } = await supabase.from('catalog').select('*');
            if (catalogData) setCatalog(catalogData);

            const { data: pestsData } = await supabase.from('pests').select('*');
            if (pestsData) setPests(pestsData);

            let { data: irrigationData, error: irrigationError } = await supabase.from('irrigation_systems').select('status').eq('garden_id', gardenId).single();
            if (irrigationError) {
                await supabase.from('irrigation_systems').insert({ garden_id: gardenId });
                setIrrigationStatus('off');
            } else if (irrigationData) {
                setIrrigationStatus(irrigationData.status);
            }
        }
        fetchInitialData();
        
        async function fetchPlants(id) { const { data } = await supabase.from('plants').select('*').eq('garden_id', id).order('created_at', { ascending: false }); if (data) setPlants(data); } fetchPlants(gardenId);
        
        const plantsChannel = supabase.channel(`plants-channel-${gardenId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'plants', filter: `garden_id=eq.${gardenId}` }, () => fetchPlants(gardenId)).subscribe();
        const irrigationChannel = supabase.channel(`irrigation-channel-${gardenId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'irrigation_systems', filter: `garden_id=eq.${gardenId}` }, (payload) => { setIrrigationStatus(payload.new.status); }).subscribe();

        return () => {
            supabase.removeChannel(plantsChannel);
            supabase.removeChannel(irrigationChannel);
        };
    }, [gardenId]);

    const handleToggleIrrigation = async () => {
        const newStatus = irrigationStatus === 'on' ? 'off' : 'on';
        const oldStatus = irrigationStatus;
        setIsLoading(true);
        // Atualiza o estado local imediatamente para feedback visual instantâneo
        setIrrigationStatus(newStatus);
        const { error } = await supabase
            .from('irrigation_systems')
            .update({ status: newStatus, last_activated_at: new Date() })
            .eq('garden_id', gardenId);
        if (error) {
            // Se houver erro, reverte o estado para o valor anterior
            setIrrigationStatus(oldStatus);
            Alert.alert("Erro", "Não foi possível alterar o status da irrigação.");
        }
        setIsLoading(false);
    };

    const handleAddPlant = async () => {
        if (!plantName || !plantDate) {
            Alert.alert('Campos Incompletos', 'Selecione uma planta e preencha a data.');
            return;
        }

        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        let uploadedImageUrl = null;
        const catalogPlant = catalog.find((p) => p.name === plantName);

        if (plantImageURI) {
            try {
                const response = await fetch(plantImageURI);
                const blob = await response.blob();
                const file = new File([blob], 'plant.jpg', { type: blob.type });
                const filePath = `${user.id}/${Date.now()}`;
                const { error: uploadError } = await supabase.storage
                    .from('plant_images')
                    .upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage
                    .from('plant_images')
                    .getPublicUrl(filePath);
                uploadedImageUrl = urlData.publicUrl;
            } catch (error) {
                Alert.alert('Erro no Upload', error.message);
                setIsLoading(false);
                return;
            }
        }

        const { data: newPlant, error } = await supabase
            .from('plants')
            .insert([
                {
                    name: plantName,
                    date: plantDate,
                    image: uploadedImageUrl,
                    catalog_image: catalogPlant?.image,
                    user_id: user.id,
                    garden_id: gardenId,
                },
            ])
            .select();

        setIsLoading(false);
        if (error) {
            Alert.alert('Erro ao Salvar', error.message);
            return;
        }
        if (newPlant && newPlant.length > 0) {
            setPlants((currentPlants) => [newPlant[0], ...currentPlants]);
            setPlantName('');
            setPlantDate('');
            setPlantImageURI(null);
            setModalVisible(false);
        }
    };

    const handleRemovePlant = async (plantId) => {
        const { error } = await supabase.from('plants').delete().eq('id', plantId);
        if (error) {
            Alert.alert('Erro ao apagar planta', error.message);
            return;
        }
        setPlants((currentPlants) => currentPlants.filter((plant) => plant.id !== plantId));
    };

    const handleChooseFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) {
            setPlantImageURI(result.assets[0].uri);
        }
    };

    const handleTakePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) {
            setPlantImageURI(result.assets[0].uri);
        }
    };
    const PlantDetailScreen=({plant,onClose})=>(<View style={styles.pageContainer}><View style={styles.catalogHeader}><Text style={styles.pageTitle} numberOfLines={1}>{plant.name}</Text><Button title="Voltar" onPress={onClose} color="#388E3C"/></View><ScrollView><Card style={styles.detailCard}><Image source={{uri:plant.image}} style={styles.detailImage}/><Card.Content style={styles.detailContent}><Text style={styles.catalogScientificName}>{plant.scientific_name}</Text><Text style={styles.catalogDescription}>{plant.description}</Text></Card.Content><View style={styles.detailInfoContainer}><View style={styles.infoItem}><Text style={styles.infoIcon}>🕒</Text><Text style={styles.infoLabel}>Colheita em</Text><Text style={styles.infoValue}>{plant.harvest_time}</Text></View><View style={styles.infoItem}><Text style={styles.infoIcon}>🗓️</Text><Text style={styles.infoLabel}>Plantar na</Text><Text style={styles.infoValue}>{plant.planting_season}</Text></View></View><Card.Content style={styles.detailTipsSection}><Text style={styles.tipTitle}>Dicas de Cultivo</Text>{plant.tips.map((tip,index)=>(<View key={index} style={styles.tipListItem}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipContent}>{tip}</Text></View>))}</Card.Content></Card></ScrollView></View>);
    const PestsScreen = ({pests,onClose})=>(<View style={styles.pageContainer}><View style={styles.catalogHeader}><Text style={styles.pageTitle}>Pragas Comuns</Text><Button title="Voltar" onPress={onClose} color="#388E3C"/></View><FlatList data={pests} keyExtractor={(item)=>item.id.toString()} renderItem={({item})=>(<Card style={styles.pestCard}><Image source={{uri:item.image}} style={styles.pestImage}/><Card.Content style={{paddingTop:12}}><Text style={styles.pestName}>{item.name}</Text><Text style={styles.pestDescription}>{item.description}</Text><Text style={styles.pestSectionTitle}>Sintomas:</Text><Text style={styles.pestContent}>{item.symptoms}</Text><Text style={styles.pestSectionTitle}>Solução Orgânica:</Text><Text style={styles.pestSolutionText}>{item.solution}</Text></Card.Content></Card>)}/></View>);
    const CatalogScreen = ({catalog,onClose, onSelectPlant})=>(<View style={styles.pageContainer}><View style={styles.catalogHeader}><Text style={styles.pageTitle}>Catálogo de Plantas</Text><Button title="Voltar" onPress={onClose} color="#388E3C"/></View><FlatList data={catalog} keyExtractor={(item)=>item.id.toString()} renderItem={({item})=>(<TouchableOpacity onPress={()=>onSelectPlant(item)}><Card style={styles.catalogCard}><Image source={{uri:item.image}} style={styles.catalogImage}/><Card.Content style={styles.catalogContent}><Text style={styles.catalogPlantName}>{item.name}</Text><Text style={styles.catalogDescription} numberOfLines={2}>{item.description}</Text></Card.Content></Card></TouchableOpacity>)}/></View>);
    
    if (selectedPlant) return <PlantDetailScreen plant={selectedPlant} onClose={() => setSelectedPlant(null)} />; if (isPestsVisible) return <PestsScreen pests={pests} onClose={() => setIsPestsVisible(false)} />; if (isCatalogVisible) return <CatalogScreen catalog={catalog} onClose={() => setIsCatalogVisible(false)} onSelectPlant={setSelectedPlant} />;
    
    return (
        <SafeAreaView style={styles.containerFull}>
            <AppHeader title={gardenName} navigation={navigation} showBackButton={true} />
            <FlatList
                ListHeaderComponent={<><Text style={styles.sectionTitle}>Ferramentas Rápidas</Text><View style={styles.featuresGrid}>
                    <TouchableOpacity style={styles.featureButton} onPress={() => setIsCatalogVisible(true)}><Text style={styles.featureText}>Catálogo</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.featureButton} onPress={() => setIsPestsVisible(true)}><Text style={styles.featureText}>Pragas</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.featureButton, irrigationStatus === 'on' && styles.irrigationButtonOn]} onPress={handleToggleIrrigation} disabled={isLoading}>
                        <Text style={styles.featureText}>{isLoading ? "Aguarde..." : irrigationStatus === 'on' ? "Desligar Irrigação" : "Irrigar Agora"}</Text>
                    </TouchableOpacity>
                </View><Text style={styles.sectionTitle}>Plantas na Horta</Text></>}
                contentContainerStyle={styles.plantListContainer} data={plants} keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (<Card style={styles.plantListItemCard}><View style={styles.plantListItemContent}><Avatar.Image size={60} source={{uri:item.image||item.catalog_image}}/><View style={styles.plantListItemInfo}><Text style={styles.plantListItemName}>{item.name}</Text><Text style={styles.plantListItemDate}>Plantado em: {item.date}</Text></View><IconButton icon="delete-outline" size={24} iconColor="#E53935" onPress={()=>handleRemovePlant(item.id)}/></View></Card>)}
                ListEmptyComponent={<View style={styles.emptyListContainer}><Text style={styles.emptyListText}>Sua horta ainda está vazia.</Text></View>}
            />
            <View style={styles.fabContainer}><TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}><Text style={styles.fabIcon}>+</Text></TouchableOpacity></View>
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => {setModalVisible(false)}}><View style={styles.modalContainer}><View style={styles.modalView}><Text style={styles.modalTitle}>Adicionar Nova Planta</Text><TouchableOpacity onPress={handleChooseFromGallery}>{plantImageURI?<Image source={{uri:plantImageURI}} style={styles.imagePreview}/>:<View style={styles.imagePlaceholder}><Text>Imagem Opcional</Text></View>}</TouchableOpacity><View style={styles.imageButtonsContainer}><Button title="Tirar Foto" onPress={handleTakePhoto} color="#4CAF50"/><Button title="Galeria" onPress={handleChooseFromGallery} color="#388E3C"/></View><TouchableOpacity style={styles.pickerTrigger} onPress={()=>setPlantPickerVisible(true)}><Text style={[styles.modalInputText,!plantName&&{color:'#aaa'}]}>{plantName||"Selecione uma planta..."}</Text></TouchableOpacity><MaskInput style={styles.modalInput} value={plantDate} onChangeText={setPlantDate} mask={[/\d/,/\d/,'/',/\d/,/\d/,'/',/\d/,/\d/,/\d/,/\d/]} placeholder="Data de Plantio (DD/MM/AAAA)" keyboardType="numeric"/><View style={styles.modalButtonContainer}><Button title="Cancelar" onPress={()=>{setModalVisible(false)}} color="#f44336"/><Button title="Salvar" disabled={isLoading} onPress={handleAddPlant} color="#4CAF50"/></View></View></View>
            </Modal>
            <Modal visible={isPlantPickerVisible} transparent={true} animationType="fade" onRequestClose={() => setPlantPickerVisible(false)}>
                <TouchableOpacity style={styles.pickerBackdrop} onPress={()=>setPlantPickerVisible(false)}><View style={styles.pickerContainer}><FlatList data={catalog} keyExtractor={item=>item.id.toString()} renderItem={({item})=>(<TouchableOpacity style={styles.pickerItem} onPress={()=>{setPlantName(item.name);setPlantPickerVisible(false);}}><Text style={styles.pickerItemText}>{item.name}</Text></TouchableOpacity>)} /></View></TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

function GardenStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GardenList" component={GardenListScreen} />
            <Stack.Screen name="Garden" component={GardenScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
        </Stack.Navigator>
    );
}

function RootNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{ headerShown: false, drawerPosition: 'right', drawerStyle: { width: '70%' }, drawerActiveTintColor: '#388E3C', drawerInactiveTintColor: '#424242' }}>
            <Drawer.Screen name="HomeStack" component={GardenStackNavigator} options={{ drawerLabel: 'Minhas Hortas' }} />
            <Drawer.Screen name="AccountDrawer" component={AccountScreen} options={{ drawerLabel: 'Minha Conta' }} />
        </Drawer.Navigator>
    );
}

export default function App() {
  const [session, setSession] = useState(null);
  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); }); const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); }); return () => { authListener.subscription.unsubscribe(); }; }, []);
  return ( <NavigationContainer>{session && session.user ? <RootNavigator /> : <AuthScreen />}</NavigationContainer> );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: '#F5F5F5' }, containerFull: { flex: 1, backgroundColor: '#F5F5F5' }, title: { fontSize: 32, fontWeight: 'bold', color: '#388E3C', textAlign: 'center', marginBottom: 40 }, input: { backgroundColor: 'white', flex: 1, padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#ddd' }, authInput: { backgroundColor: 'white', width: '100%', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#ddd', marginBottom: 15, }, button: { padding: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginBottom: 10 }, signInButton: { backgroundColor: '#388E3C' }, signUpButton: { backgroundColor: '#4CAF50' }, buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }, header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 30, }, headerSide: { width: 60, justifyContent: 'center', alignItems: 'center' }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#388E3C', }, inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20, paddingHorizontal: 16, }, createButton: { backgroundColor: '#388E3C', padding: 15, justifyContent: 'center', borderRadius: 10, marginLeft: 10 }, createButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }, gardenItem: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginBottom: 10, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16,}, gardenName: { fontSize: 18, fontWeight: '500', flex: 1 }, emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' }, pageContainer: { flex: 1, backgroundColor: '#F5F5F5' }, pageContent: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 20, }, plantListContainer: { paddingHorizontal: 16, paddingBottom: 20 }, plantListItemCard: { marginBottom: 12, borderRadius: 15, backgroundColor: '#fff', elevation: 2 }, plantListItemContent: { flexDirection: 'row', alignItems: 'center', padding: 10 }, plantListItemInfo: { flex: 1, marginLeft: 15 }, plantListItemName: { fontSize: 18, fontWeight: '600', color: '#333' }, plantListItemDate: { fontSize: 13, color: 'gray' }, emptyListContainer: { alignItems: 'center', paddingVertical: 50 }, emptyListText: { fontSize: 18, fontWeight: 'bold', color: '#757575', marginTop: 16 }, sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#424242', marginTop: 10, marginBottom: 10, marginLeft: 16 }, featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 8 }, featureButton: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 15, alignItems: 'center', justifyContent: 'center', width: '45%', marginHorizontal: 5, marginBottom: 12, elevation: 2 }, featureText: { fontSize: 16, fontWeight: '600', color: '#4CAF50' }, irrigationButtonOn: { backgroundColor: '#C8E6C9' }, fabContainer: { position: 'absolute', bottom: 25, width: '100%', alignItems: 'center' }, fab: { backgroundColor: '#4CAF50', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 }, fabIcon: { fontSize: 34, color: 'white', lineHeight: 36 }, backButtonText: { color: '#388E3C', fontSize: 16, marginLeft: 5 }, modalContainer:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.5)'}, modalView:{margin:20,backgroundColor:'white',borderRadius:20,padding:25,alignItems:'center',elevation:5,width:'90%'}, modalTitle:{fontSize:18,fontWeight:'bold',marginBottom:15}, modalInput:{width:'100%',borderWidth:1,borderColor:'#ccc',padding:12,borderRadius:10,marginBottom:15,fontSize:16}, modalButtonContainer:{flexDirection:'row',justifyContent:'space-around',width:'100%',marginTop:20}, imagePlaceholder:{width:120,height:120,borderRadius:60,backgroundColor:'#e0e0e0',justifyContent:'center',alignItems:'center',marginBottom:15}, imagePreview:{width:120,height:120,borderRadius:60,marginBottom:15,borderColor:'#4CAF50',borderWidth:2}, imageButtonsContainer:{flexDirection:'row',justifyContent:'space-evenly',width:'100%',marginBottom:20}, catalogHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingTop:50,paddingBottom:8, backgroundColor: 'white'}, pageTitle:{fontSize:22,fontWeight:'bold',color:'#388E3C',marginBottom:8,flexShrink:1}, catalogCard:{marginVertical:8,marginHorizontal:16,borderRadius:15,elevation:3,backgroundColor:'#fff'}, catalogImage:{width:'100%',height:150,borderTopLeftRadius:15,borderTopRightRadius:15}, catalogContent:{padding:12}, catalogPlantName:{fontSize:18,fontWeight:'bold',color:'#388E3C'}, catalogDescription:{fontSize:14,color:'#333',lineHeight:20}, detailCard:{margin:16,borderRadius:15,backgroundColor:'#fff',elevation:3,marginBottom:32}, detailImage:{width:'100%',height:200,borderTopLeftRadius:15,borderTopRightRadius:15}, detailContent:{padding:16,paddingBottom:0}, catalogScientificName:{fontSize:12,fontStyle:'italic',color:'gray',marginBottom:8}, detailInfoContainer:{flexDirection:'row',justifyContent:'space-around',marginTop:16,paddingVertical:16,borderTopWidth:1,borderBottomWidth:1,borderColor:'#eee'}, infoItem:{alignItems:'center'},infoIcon:{fontSize:24,marginBottom:8},infoLabel:{fontSize:13,color:'gray'}, infoValue:{fontSize:16,fontWeight:'bold',color:'#333'}, detailTipsSection:{padding:16}, tipTitle:{fontSize:18,fontWeight:'bold',color:'#388E3C',marginBottom:12}, tipListItem:{flexDirection:'row',marginBottom:8}, tipBullet:{marginRight:8,fontSize:15,lineHeight:22,color:'#388E3C',fontWeight:'bold'}, tipContent:{flex:1,fontSize:15,lineHeight:22,color:'#333'}, pestCard:{marginVertical:8,marginHorizontal:16,borderRadius:15,elevation:3,backgroundColor:'#fff',paddingBottom:8}, pestImage:{width:'100%',height:150,borderTopLeftRadius:15,borderTopRightRadius:15}, pestName:{fontSize:18,fontWeight:'bold',color:'#c62828',marginBottom:4,paddingHorizontal:16}, pestDescription:{fontSize:14,color:'#333',marginBottom:12,fontStyle:'italic',paddingHorizontal:16}, pestSectionTitle:{fontSize:15,fontWeight:'bold',color:'#333',marginTop:8,paddingHorizontal:16}, pestContent:{fontSize:14,color:'#424242',marginBottom:8,paddingHorizontal:16}, pestSolutionText:{fontSize:14,color:'#388E3C',fontWeight:'500',paddingHorizontal:16}, pickerTrigger:{width:'100%',borderWidth:1,borderColor:'#ccc',padding:12,borderRadius:10,marginBottom:15}, modalInputText:{fontSize:16,color:'#000'}, pickerBackdrop:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.5)'}, pickerContainer:{backgroundColor:'white',width:'80%',maxHeight:'60%',borderRadius:10,padding:10}, pickerItem:{paddingVertical:15,borderBottomWidth:1,borderBottomColor:'#eee'}, pickerItemText:{fontSize:18,textAlign:'center'}, accountAvatar: { backgroundColor: '#e0e0e0', marginBottom: 20 }, avatarUploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50 }, accountLabel: { fontSize: 16, color: 'gray' }, accountEmail: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 40 }, drawerHeader: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10 }, drawerEmail: { marginTop: 10, fontSize: 16, fontWeight: '500', color: '#333' }, drawerSignOutButton: { paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#eee', marginTop: 10 }, drawerSignOutText: { fontSize: 16, fontWeight: 'bold', color: '#c62828' }, inviteCard: { marginVertical: 8, marginHorizontal: 16, borderRadius: 10, elevation: 2, backgroundColor: '#fff' }, inviteText: { fontSize: 16, lineHeight: 22, marginBottom: 15 }, inviteActions: { flexDirection: 'row', justifyContent: 'flex-end' }, inviteButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginLeft: 10 }, acceptButton: { backgroundColor: '#4CAF50' }, rejectButton: { backgroundColor: '#f44336' }, inviteButtonText: { color: 'white', fontWeight: 'bold' },
});