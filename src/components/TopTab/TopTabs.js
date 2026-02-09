import React from 'react';
import {FlatList, Pressable, Text, View, StyleSheet} from 'react-native';
import {scale} from '../../utils/Scalling';
import {COLORS} from '../../theme/Colors';

export default function TopTabs({tabs, activeId, onChange}) {
	const renderItem = ({item}) => {
		const isActive = item.id === activeId;
		return (
			<Pressable onPress={() => onChange?.(item.id)} style={styles.tabItem} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
				<Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]} numberOfLines={1}>
					{item.title}
				</Text>
				{isActive ? <View style={styles.tabIndicator} /> : null}
			</Pressable>
		);
	};

	return (
		<FlatList
			horizontal
			scrollEnabled
			data={tabs}
			keyExtractor={item => item.id}
			renderItem={renderItem}
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: scale(16),
		paddingVertical: scale(8),
	},
	tabItem: {
		marginRight: scale(20),
		alignItems: 'center',
	},
	tabText: {
		color: COLORS.white,
		fontSize: scale(16),
	},
	tabTextActive: {
		opacity: 1,
		fontWeight: '800',
		color: COLORS.primory1,
	},
	tabTextInactive: {
		opacity: 0.6,
		fontWeight: '600',
	},
	tabIndicator: {
		height: scale(4),
		backgroundColor: COLORS.primory1,
		marginTop: scale(8),
		borderRadius: scale(3),
		alignSelf: 'stretch',
		width: '100%',
	},
});


